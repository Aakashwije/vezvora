"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, CheckCircle2, ChevronRight, Clock, Pause, Send, UserPlus } from "lucide-react";
import { assignLeadAction } from "@/lib/admin/actions";
import type { ActionGroup, ActionItem, ActionSeverity, ActionVerb } from "@/lib/admin/dashboard";
import type { TeamMember } from "@/lib/admin/types";
import {
  retryQuotationEmailAction,
  sendQuotationNowAction,
  setQuotationStatusAction,
} from "@/lib/quotation/actions";
import { cx } from "@/lib/cx";
import { useSecondClock } from "./clock";
import { TimeAgo } from "./TimeAgo";
import styles from "./dashboard.module.css";

type Feedback = { ok: boolean; text: string };

const SEVERITY_ICON: Record<ActionSeverity, typeof AlertTriangle> = {
  critical: AlertTriangle,
  urgent: Clock,
  attention: UserPlus,
};

function money(value: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-LK", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `${currency} ${Math.round(value).toLocaleString("en-US")}`;
  }
}

/** Minutes and seconds until a queued quotation goes out. */
function Countdown({ deadline }: { deadline: string }) {
  const now = useSecondClock();
  if (now === null) return <span className={styles.rowClock}>--:--</span>;

  const left = new Date(deadline).getTime() - now;
  if (left <= 0) return <span className={cx(styles.rowClock, styles.rowClockDue)}>Sending</span>;

  const total = Math.floor(left / 1000);
  return (
    <span className={cx(styles.rowClock, left <= 120_000 && styles.rowClockDue)}>
      {Math.floor(total / 60)}:{String(total % 60).padStart(2, "0")}
    </span>
  );
}

/**
 * Today's action centre.
 *
 * The work that needs a person, most urgent first, with the decision available
 * inline so routine cases never need the record opened. Every control is a real
 * button beside the row's link rather than inside it — nesting a button in an
 * anchor is invalid and breaks keyboard use.
 */
export function ActionCentre({
  groups,
  team,
}: {
  groups: ActionGroup[];
  team: TeamMember[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  function run(item: ActionItem, label: string, action: () => Promise<unknown>) {
    setBusyId(item.id);
    setFeedback(null);
    startTransition(async () => {
      try {
        const result = await action();
        const failed =
          result !== null && typeof result === "object" && "ok" in result && result.ok === false;
        setFeedback(
          failed
            ? { ok: false, text: String((result as { error?: string }).error ?? "That did not work.") }
            : { ok: true, text: `${item.title}: ${label}` },
        );
      } catch {
        setFeedback({ ok: false, text: "Something went wrong. Please try again." });
      } finally {
        setBusyId(null);
        router.refresh();
      }
    });
  }

  if (groups.length === 0) {
    return (
      <section className={styles.panel}>
        <div className={styles.panelHead}>
          <h2 className={styles.panelTitle}>Action centre</h2>
        </div>
        <div className={styles.allClear}>
          <CheckCircle2 size={22} aria-hidden />
          <div>
            <strong>Nothing needs you right now.</strong>
            <p>No approvals waiting, no failed deliveries, and every lead has an owner.</p>
          </div>
        </div>
      </section>
    );
  }

  const total = groups.reduce((sum, group) => sum + group.items.length, 0);

  return (
    <section className={styles.panel}>
      <div className={styles.panelHead}>
        <h2 className={styles.panelTitle}>
          Action centre
          <span className={styles.panelCount}>{total}</span>
        </h2>
        {feedback && (
          <p
            className={cx(styles.feedback, feedback.ok ? styles.feedbackOk : styles.feedbackError)}
            role="status"
          >
            {feedback.text}
          </p>
        )}
      </div>

      <div className={styles.groups}>
        {groups.map((group) => {
          const Icon = SEVERITY_ICON[group.severity];
          return (
            <div key={group.kind} className={styles.group}>
              <div className={cx(styles.groupHead, styles[group.severity])}>
                <Icon size={15} aria-hidden />
                <span className={styles.groupLabel}>{group.label}</span>
                <span className={styles.groupCount}>{group.items.length}</span>
              </div>

              <ul className={styles.rows}>
                {group.items.map((item) => {
                  const busy = pending && busyId === item.id;
                  return (
                    <li key={item.id} className={cx(styles.row, busy && styles.rowBusy)}>
                      <div className={styles.rowMain}>
                        <div className={styles.rowTitle}>
                          <Link href={item.href} className={styles.rowLink}>
                            {item.title}
                          </Link>
                          <span className={styles.rowSubtitle}>{item.subtitle}</span>
                        </div>
                        <p className={styles.rowReason}>{item.reason}</p>
                      </div>

                      <div className={styles.rowSide}>
                        {item.amount && (
                          <span className={styles.rowAmount}>
                            {money(item.amount.value, item.amount.currency)}
                          </span>
                        )}
                        {item.deadline ? (
                          <Countdown deadline={item.deadline} />
                        ) : (
                          <span className={styles.rowAge}>
                            <TimeAgo iso={item.at} />
                          </span>
                        )}
                      </div>

                      <div className={styles.rowActions}>
                        {item.verbs.map((verb) =>
                          renderVerb(verb, item, { busy, team, run }),
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>
    </section>
  );
}

type VerbContext = {
  busy: boolean;
  team: TeamMember[];
  run: (item: ActionItem, label: string, action: () => Promise<unknown>) => void;
};

function renderVerb(verb: ActionVerb, item: ActionItem, ctx: VerbContext) {
  const { busy, team, run } = ctx;

  switch (verb) {
    case "review":
      return (
        <Link key={verb} href={item.href} className={cx(styles.action, styles.actionGhost)}>
          Review <ChevronRight size={13} />
        </Link>
      );

    case "approve":
      return (
        <button
          key={verb}
          type="button"
          className={cx(styles.action, styles.actionPrimary)}
          disabled={busy}
          onClick={() =>
            run(item, "approved", () => setQuotationStatusAction(item.targetId, "approved"))
          }
        >
          <CheckCircle2 size={13} /> Approve
        </button>
      );

    case "hold":
      return (
        <button
          key={verb}
          type="button"
          className={styles.action}
          disabled={busy}
          onClick={() => run(item, "held", () => setQuotationStatusAction(item.targetId, "held"))}
        >
          <Pause size={13} /> Hold
        </button>
      );

    case "send":
      return (
        <button
          key={verb}
          type="button"
          className={styles.action}
          disabled={busy}
          onClick={() => run(item, "sent", () => sendQuotationNowAction(item.targetId))}
        >
          <Send size={13} /> Send
        </button>
      );

    case "retry":
      return (
        <button
          key={verb}
          type="button"
          className={cx(styles.action, styles.actionPrimary)}
          disabled={busy}
          onClick={() => run(item, "retried", () => retryQuotationEmailAction(item.targetId))}
        >
          <Send size={13} /> Retry
        </button>
      );

    case "assign":
      return (
        <label key={verb} className={styles.assign}>
          <span className={styles.srOnly}>Assign {item.title}</span>
          <select
            className={styles.assignSelect}
            disabled={busy}
            defaultValue=""
            onChange={(event) => {
              const memberId = event.target.value;
              if (!memberId) return;
              const member = team.find((entry) => entry.id === memberId);
              run(item, `assigned to ${member?.name ?? "someone"}`, () =>
                assignLeadAction(item.targetId, memberId),
              );
            }}
          >
            <option value="" disabled>
              Assign…
            </option>
            {team.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name}
              </option>
            ))}
          </select>
        </label>
      );
  }
}
