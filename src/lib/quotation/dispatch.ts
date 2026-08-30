/**
 * The send worker.
 *
 * Called by the QStash callback, by the cron sweeper, and by an administrator
 * pressing "Send now" or "Retry". Every path funnels through
 * `dispatchQuotation`, so the idempotency and locking rules only exist once.
 *
 * Dependencies are injected rather than imported as singletons so the whole
 * workflow — including duplicate execution and failure retry — is testable
 * without Redis or a mail provider.
 */

import { randomUUID } from "node:crypto";
import type { Mailer } from "./email.ts";
import { log } from "./log.ts";
import { renderQuotationPdf } from "./pdf.ts";
import type { QuotationStore } from "./store.ts";
import { AUTO_SENDABLE_STATUSES, mayAutoSend, type QuotationRecord } from "./types.ts";

export type DispatchTrigger = "auto" | "manual" | "retry";

export type DispatchSkipReason =
  | "not_found"
  | "not_due"
  | "not_sendable"
  | "already_sent"
  | "in_flight"
  | "requires_approval"
  | "locked";

export type DispatchResult =
  | { sent: true; record: QuotationRecord; messageId: string | null }
  | { sent: false; skipped: DispatchSkipReason; record: QuotationRecord | null }
  | { sent: false; failed: true; error: string; record: QuotationRecord | null };

/** A send stuck in `sending` for longer than this is treated as abandoned. */
const STALE_SENDING_MS = 5 * 60_000;

function activity(actor: string, action: string, detail?: string) {
  return { id: `ac_${randomUUID()}`, at: new Date().toISOString(), actor, action, detail };
}

/**
 * Decide whether a record may be sent right now. Pure, so the state matrix is
 * directly unit-testable and identical for every caller.
 */
export function canDispatch(
  record: QuotationRecord,
  trigger: DispatchTrigger,
  now: number,
): { ok: true } | { ok: false; reason: DispatchSkipReason } {
  if (record.status === "sent") return { ok: false, reason: "already_sent" };

  if (record.status === "sending") {
    const claimedAt = record.sendClaimedAt ? new Date(record.sendClaimedAt).getTime() : 0;
    // Only a deliberate retry may take over an abandoned in-flight send.
    const recoverable = trigger === "retry" && now - claimedAt > STALE_SENDING_MS;
    return recoverable ? { ok: true } : { ok: false, reason: "in_flight" };
  }

  if (trigger === "retry") {
    return record.status === "failed" ? { ok: true } : { ok: false, reason: "not_sendable" };
  }

  if (trigger === "manual") {
    // An administrator may send from any non-terminal state, including a hold
    // they are explicitly releasing by pressing Send.
    const sendable: QuotationRecord["status"][] = [
      "pending_review",
      "updated",
      "approved",
      "held",
      "failed",
    ];
    return sendable.includes(record.status) ? { ok: true } : { ok: false, reason: "not_sendable" };
  }

  // trigger === "auto"
  if (!AUTO_SENDABLE_STATUSES.includes(record.status)) {
    return { ok: false, reason: "not_sendable" };
  }
  // The confidence rules withhold estimates that are expensive, bespoke or too
  // thinly described to email unseen. Checked before the deadline so the reason
  // reported is the meaningful one rather than "not yet due".
  if (!mayAutoSend(record)) {
    return { ok: false, reason: "requires_approval" };
  }
  if (now < new Date(record.reviewDeadline).getTime()) {
    return { ok: false, reason: "not_due" };
  }
  return { ok: true };
}

export type DispatchDeps = {
  store: QuotationStore;
  mailer: Mailer;
  /** Overridable so tests can assert without exercising pdf-lib. */
  renderPdf?: (record: QuotationRecord) => Promise<{ bytes: Uint8Array; hash: string }>;
  now?: () => number;
};

export async function dispatchQuotation(
  deps: DispatchDeps,
  options: { id: string; trigger: DispatchTrigger; actor?: string },
): Promise<DispatchResult> {
  const { store, mailer } = deps;
  const renderPdf = deps.renderPdf ?? renderQuotationPdf;
  const now = deps.now ?? Date.now;
  const actor = options.actor ?? (options.trigger === "auto" ? "System (auto-send)" : "System");

  // Held in an object so TypeScript keeps the type across the closure assignment.
  const outcome: { reason: DispatchSkipReason | null } = { reason: null };

  /* 1. Claim the send atomically. The mutator runs under the record's lock on
   *    the freshest stored copy, so two concurrent workers cannot both proceed:
   *    the loser sees status `sending` and stops. */
  let claimed: QuotationRecord | null;
  try {
    claimed = await store.update(options.id, (record) => {
      const verdict = canDispatch(record, options.trigger, now());
      if (!verdict.ok) {
        outcome.reason = verdict.reason;
        return null;
      }

      const attempts = record.email.attempts + 1;
      return {
        ...record,
        status: "sending",
        sendClaimedAt: new Date(now()).toISOString(),
        email: {
          ...record.email,
          state: "sending",
          attempts,
          lastAttemptAt: new Date(now()).toISOString(),
          // Stable per (revision, attempt): a re-run of the same attempt is
          // deduplicated by the provider; a deliberate retry gets a fresh key.
          idempotencyKey: `${record.id}:r${record.revision}:a${attempts}`,
        },
        activity: [
          ...record.activity,
          activity(actor, "send_started", `Trigger: ${options.trigger}`),
        ],
      };
    });
  } catch {
    // `update` throws only when the lock could not be taken in time.
    log.warn("dispatch_locked", { quotationId: options.id, trigger: options.trigger });
    return { sent: false, skipped: "locked", record: null };
  }

  if (!claimed) {
    const record = await store.get(options.id);
    const reason: DispatchSkipReason = outcome.reason ?? (record ? "not_sendable" : "not_found");
    log.info("dispatch_skipped", {
      quotationId: options.id,
      number: record?.number ?? null,
      trigger: options.trigger,
      status: record?.status ?? null,
      reason,
    });
    return { sent: false, skipped: reason, record };
  }

  /* 2. Render and send outside the lock — these are slow network/CPU calls and
   *    the `sending` status is already holding the record for us. */
  try {
    const pdf = await renderPdf(claimed);
    const result = await mailer.sendQuotation(
      claimed,
      pdf.bytes,
      claimed.email.idempotencyKey ?? `${claimed.id}:fallback`,
    );

    if (!result.ok) throw new Error(result.error);

    const sent = await store.update(options.id, (record) => ({
      ...record,
      status: "sent",
      sentAt: new Date(now()).toISOString(),
      pdfGeneratedAt: new Date(now()).toISOString(),
      pdfHash: pdf.hash,
      email: {
        ...record.email,
        state: "sent",
        provider: result.provider,
        messageId: result.messageId,
        lastError: null,
      },
      activity: [
        ...record.activity,
        activity(actor, "sent", `Provider message ${result.messageId ?? "n/a"}`),
      ],
    }));

    log.info("dispatch_sent", {
      quotationId: options.id,
      number: claimed.number,
      trigger: options.trigger,
      provider: result.provider,
      messageId: result.messageId,
      attempts: claimed.email.attempts,
    });
    return { sent: true, record: sent ?? claimed, messageId: result.messageId };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown send error";
    const failed = await store.update(options.id, (record) => ({
      ...record,
      status: "failed",
      sendClaimedAt: null,
      email: { ...record.email, state: "failed", lastError: message.slice(0, 500) },
      activity: [...record.activity, activity(actor, "send_failed", message.slice(0, 200))],
    }));

    log.error("dispatch_failed", {
      quotationId: options.id,
      number: claimed.number,
      trigger: options.trigger,
      error: message.slice(0, 200),
    });
    return { sent: false, failed: true, error: message, record: failed };
  }
}

/**
 * Sweep every quotation whose review window has closed. Used by the Vercel Cron
 * fallback; safe to run as often as you like because `dispatchQuotation` is the
 * one that decides whether anything actually happens.
 */
export async function dispatchDueQuotations(
  deps: DispatchDeps,
): Promise<{ examined: number; sent: number; skipped: number; failed: number }> {
  const now = deps.now ?? Date.now;
  const due = await deps.store.dueForDispatch(now());
  let sent = 0;
  let skipped = 0;
  let failed = 0;

  for (const record of due) {
    const result = await dispatchQuotation(deps, { id: record.id, trigger: "auto" });
    if ("sent" in result && result.sent) sent += 1;
    else if ("failed" in result) failed += 1;
    else skipped += 1;
  }

  log.info("sweep_complete", { examined: due.length, sent, skipped, failed });
  return { examined: due.length, sent, skipped, failed };
}
