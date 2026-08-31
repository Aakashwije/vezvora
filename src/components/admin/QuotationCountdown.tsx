"use client";

import { cx } from "@/lib/cx";
import { isAwaitingAutoSend, needsApproval } from "@/lib/quotation/status-meta";
import type { QuotationStatus } from "@/lib/quotation/types";
import { useSecondClock } from "./clock";
import styles from "./quotations.module.css";

function format(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

type Props = {
  deadline: string;
  status: QuotationStatus;
  /** The confidence verdict: false means nothing sends without approval. */
  autoSend: boolean;
  /** Compact form for table cells. */
  compact?: boolean;
};

/** Live review-window countdown shown in the list and on the detail page. */
export function QuotationCountdown({ deadline, status, autoSend, compact }: Props) {
  const now = useSecondClock();

  // Withheld by the confidence rules: there is no deadline to count down to,
  // because nothing will be sent until somebody approves it.
  if (needsApproval(status, autoSend)) {
    return (
      <span
        className={cx(styles.countdown, styles.countdownHold)}
        title="Withheld by the automatic-send rules. Approve it to release the estimate."
      >
        {compact ? "Approval" : "Needs approval"}
      </span>
    );
  }

  if (!isAwaitingAutoSend(status, autoSend)) {
    return <span className={cx(styles.countdown, styles.countdownIdle)}>—</span>;
  }

  if (now === null) {
    return <span className={cx(styles.countdown, styles.countdownIdle)}>--:--</span>;
  }

  const left = new Date(deadline).getTime() - now;
  if (left <= 0) {
    return (
      <span className={cx(styles.countdown, styles.countdownDue)}>
        {compact ? "Due" : "Sending shortly"}
      </span>
    );
  }

  const urgent = left <= 120_000;
  return (
    <span
      className={cx(styles.countdown, urgent && styles.countdownUrgent)}
      title={`Auto-sends at ${new Date(deadline).toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
      })}`}
    >
      <span className={styles.countdownDot} aria-hidden />
      {format(left)}
      {!compact && <span className={styles.countdownLabel}>until auto-send</span>}
    </span>
  );
}
