import { NextResponse } from "next/server";
import { dispatchDueQuotations } from "@/lib/quotation/dispatch";
import { mailer } from "@/lib/quotation/email";
import { log } from "@/lib/quotation/log";
import { verifyCronRequest } from "@/lib/quotation/scheduler";
import { quotationStore } from "@/lib/quotation/store";

/**
 * Vercel Cron sweeper: the durable fallback that queries persisted review
 * deadlines. It works with no QStash account at all, and covers any callback
 * QStash failed to deliver. Both paths share the idempotent worker.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

async function handle(request: Request) {
  const auth = verifyCronRequest(request);
  if (!auth.ok) {
    log.warn("cron_rejected", { reason: auth.reason });
    return NextResponse.json({ error: auth.reason }, { status: auth.status });
  }

  const summary = await dispatchDueQuotations({ store: quotationStore(), mailer: mailer() });
  return NextResponse.json({ status: "ok", ...summary });
}

export const GET = handle;
export const POST = handle;
