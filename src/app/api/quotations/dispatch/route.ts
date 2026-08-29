import { NextResponse } from "next/server";
import { dispatchQuotation } from "@/lib/quotation/dispatch";
import { mailer } from "@/lib/quotation/email";
import { log } from "@/lib/quotation/log";
import { parseDispatchPayload, verifyDispatchWebhook } from "@/lib/quotation/scheduler";
import { quotationStore } from "@/lib/quotation/store";

/**
 * QStash delivers the delayed auto-send callback here.
 *
 * The request is signature-verified before anything is read from it, and the
 * worker reloads the record from the database, so a replayed or duplicated
 * delivery cannot send a quotation twice.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const verification = await verifyDispatchWebhook(request);
  if (!verification.ok) {
    log.warn("dispatch_webhook_rejected", { reason: verification.reason });
    return NextResponse.json({ error: verification.reason }, { status: verification.status });
  }

  const payload = parseDispatchPayload(verification.body);
  if (!payload) {
    return NextResponse.json({ error: "Malformed payload." }, { status: 400 });
  }

  const result = await dispatchQuotation(
    { store: quotationStore(), mailer: mailer() },
    { id: payload.quotationId, trigger: "auto" },
  );

  if ("sent" in result && result.sent) {
    return NextResponse.json({ status: "sent", messageId: result.messageId });
  }
  if ("failed" in result) {
    // 500 so QStash retries with backoff.
    return NextResponse.json({ status: "failed" }, { status: 500 });
  }
  // A skip is a correct outcome (held, cancelled, already sent) — do not retry.
  return NextResponse.json({ status: "skipped", reason: result.skipped });
}
