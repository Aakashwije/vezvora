/**
 * Durable delayed jobs for the review window.
 *
 * Vercel functions are short-lived, so the 10-minute delay must live outside
 * the request. Two independent mechanisms cover it:
 *
 *  1. Upstash QStash publishes a delayed HTTP callback — precise, and the
 *     primary path when `QSTASH_TOKEN` is set.
 *  2. A Vercel Cron sweep queries persisted `reviewDeadline`s as a safety net.
 *     On Vercel Hobby it runs daily, so QStash is required for precise timing.
 *
 * Both funnel into the same worker, which is idempotent, so a quotation covered
 * by both is still only sent once.
 */

import { Client, Receiver } from "@upstash/qstash";
import { appOrigin, cronSecret, qstashConfigured } from "./config.ts";
import { log } from "./log.ts";
import type { QuotationRecord } from "./types.ts";

export type ScheduleOutcome = { scheduler: "qstash" | "cron"; jobId: string | null };

export const DISPATCH_CALLBACK_PATH = "/api/quotations/dispatch";

/**
 * Schedule the automatic send. Never throws: a scheduling failure degrades to
 * the cron sweeper rather than failing the customer's submission.
 */
export async function scheduleDispatch(record: QuotationRecord): Promise<ScheduleOutcome> {
  const delaySeconds = Math.max(
    0,
    Math.round((new Date(record.reviewDeadline).getTime() - Date.now()) / 1000),
  );

  if (!qstashConfigured()) {
    log.info("schedule_cron_only", { quotationId: record.id, number: record.number, delaySeconds });
    return { scheduler: "cron", jobId: null };
  }

  try {
    const client = new Client({ token: process.env.QSTASH_TOKEN! });
    const response = await client.publishJSON({
      url: `${appOrigin()}${DISPATCH_CALLBACK_PATH}`,
      body: { quotationId: record.id },
      delay: delaySeconds,
      retries: 3,
    });
    const jobId = "messageId" in response ? response.messageId : null;
    log.info("schedule_qstash", { quotationId: record.id, number: record.number, delaySeconds, jobId });
    return { scheduler: "qstash", jobId };
  } catch (error) {
    log.warn("schedule_qstash_failed", {
      quotationId: record.id,
      number: record.number,
      error: error instanceof Error ? error.message : "unknown",
    });
    // The cron sweeper will still pick this up at its deadline.
    return { scheduler: "cron", jobId: null };
  }
}

export type WebhookVerification =
  | { ok: true; body: string }
  | { ok: false; status: 401 | 500; reason: string };

/**
 * Verify a QStash callback's signature. Fails closed: an unconfigured verifier
 * rejects every request rather than accepting unsigned ones.
 */
export async function verifyDispatchWebhook(request: Request): Promise<WebhookVerification> {
  const currentSigningKey = process.env.QSTASH_CURRENT_SIGNING_KEY;
  const nextSigningKey = process.env.QSTASH_NEXT_SIGNING_KEY;

  const body = await request.text();

  if (!currentSigningKey || !nextSigningKey) {
    return {
      ok: false,
      status: 500,
      reason: "QSTASH signing keys are not configured on this deployment.",
    };
  }

  const signature = request.headers.get("upstash-signature");
  if (!signature) return { ok: false, status: 401, reason: "Missing signature." };

  try {
    const receiver = new Receiver({ currentSigningKey, nextSigningKey });
    const valid = await receiver.verify({ signature, body });
    if (!valid) return { ok: false, status: 401, reason: "Invalid signature." };
    return { ok: true, body };
  } catch {
    return { ok: false, status: 401, reason: "Invalid signature." };
  }
}

/**
 * Authorize the cron sweeper. Vercel sends `Authorization: Bearer $CRON_SECRET`
 * on scheduled invocations; without a configured secret the route is closed.
 */
export function verifyCronRequest(request: Request): { ok: true } | { ok: false; status: 401 | 500; reason: string } {
  const secret = cronSecret();
  if (!secret) {
    return { ok: false, status: 500, reason: "CRON_SECRET is not configured on this deployment." };
  }

  const header = request.headers.get("authorization") ?? "";
  const provided = header.startsWith("Bearer ") ? header.slice(7) : header;
  if (!timingSafeEquals(provided, secret)) {
    return { ok: false, status: 401, reason: "Unauthorized." };
  }
  return { ok: true };
}

/** Constant-time string comparison that does not leak length via early exit. */
export function timingSafeEquals(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let index = 0; index < a.length; index += 1) {
    mismatch |= a.charCodeAt(index) ^ b.charCodeAt(index);
  }
  return mismatch === 0;
}

/** Parse the callback payload without trusting its shape. */
export function parseDispatchPayload(body: string): { quotationId: string } | null {
  try {
    const parsed = JSON.parse(body) as { quotationId?: unknown };
    return typeof parsed.quotationId === "string" ? { quotationId: parsed.quotationId } : null;
  } catch {
    return null;
  }
}
