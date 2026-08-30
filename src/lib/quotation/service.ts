/**
 * Submission pipeline: validate, price, persist, render, notify, schedule.
 *
 * Server-only. The client sends requirements; every number, identifier and
 * deadline below is produced here.
 */

import "server-only";

import { RATE_LIMIT, reviewDeadlineFrom, reviewMinutes } from "./config.ts";
import { mailer } from "./email.ts";
import { log } from "./log.ts";
import { renderQuotationPdf } from "./pdf.ts";
import { calculateQuotation } from "./pricing.ts";
import { quotationStore, type QuotationStore } from "./store.ts";
import { scheduleDispatch } from "./scheduler.ts";
import type { QuotationRecord, QuotationRequirements } from "./types.ts";

/** What the customer's confirmation screen is allowed to know. */
export type QuotationReceipt = {
  id: string;
  number: string;
  currency: string;
  rangeLow: number;
  rangeHigh: number;
  deliveryLabel: string;
  validityDays: number;
  email: string;
  reviewMinutes: number;
};

export function toReceipt(record: QuotationRecord): QuotationReceipt {
  return {
    id: record.id,
    number: record.number,
    currency: record.document.totals.currency,
    rangeLow: record.document.totals.rangeLow,
    rangeHigh: record.document.totals.rangeHigh,
    deliveryLabel: record.document.schedule.deliveryLabel,
    validityDays: record.document.validityDays,
    email: record.requirements.email,
    reviewMinutes: reviewMinutes(),
  };
}

/** Durable, shared across serverless instances when Redis is configured. */
export async function isSubmissionRateLimited(
  clientKey: string,
  store: QuotationStore = quotationStore(),
): Promise<boolean> {
  return store.isRateLimited(`submit:${clientKey}`, RATE_LIMIT.max, RATE_LIMIT.windowSeconds);
}

export async function createQuotation(
  requirements: QuotationRequirements,
  options: { source?: string; store?: QuotationStore } = {},
): Promise<QuotationRecord> {
  const store = options.store ?? quotationStore();
  const config = await store.getPricingConfig();
  const document = calculateQuotation(requirements, config);
  const createdAt = new Date().toISOString();

  const record = await store.create({
    status: "pending_review",
    requirements,
    document,
    revision: 0,
    pdfGeneratedAt: null,
    pdfHash: null,
    createdAt,
    reviewDeadline: reviewDeadlineFrom(createdAt),
    sentAt: null,
    sendClaimedAt: null,
    adminNotes: "",
    email: {
      state: "not_sent",
      provider: null,
      messageId: null,
      attempts: 0,
      lastAttemptAt: null,
      lastError: null,
      idempotencyKey: null,
    },
    revisions: [],
    activity: [
      {
        id: `ac_${createdAt}`,
        at: createdAt,
        actor: requirements.contactName,
        action: "submitted",
        detail: options.source ?? "Instant estimate",
      },
    ],
    source: options.source ?? "Instant estimate",
    scheduledJobId: null,
    scheduler: "none",
  });

  log.info("quotation_created", {
    quotationId: record.id,
    number: record.number,
    service: requirements.service,
    total: record.document.totals.total,
    reviewMinutes: reviewMinutes(),
  });

  // Everything below is best-effort: the customer's submission is already
  // safely persisted, so a PDF, email or scheduler hiccup must not fail it.
  const withPdf = await stampPdf(record, store);
  await notifyAdmin(withPdf);
  return scheduleAutoSend(withPdf, store);
}

async function stampPdf(record: QuotationRecord, store: QuotationStore): Promise<QuotationRecord> {
  try {
    const pdf = await renderQuotationPdf(record);
    const updated = await store.update(record.id, (current) => ({
      ...current,
      pdfGeneratedAt: new Date().toISOString(),
      pdfHash: pdf.hash,
    }));
    log.info("pdf_generated", {
      quotationId: record.id,
      number: record.number,
      bytes: pdf.bytes.byteLength,
      letterhead: pdf.usedLetterhead,
    });
    return updated ?? record;
  } catch (error) {
    log.error("pdf_generation_failed", {
      quotationId: record.id,
      number: record.number,
      error: error instanceof Error ? error.message : "unknown",
    });
    return record;
  }
}

async function notifyAdmin(record: QuotationRecord): Promise<void> {
  try {
    const result = await mailer().notifyAdmin(record);
    log.info("admin_notified", {
      quotationId: record.id,
      number: record.number,
      ok: result.ok,
      error: result.ok ? null : result.error,
    });
  } catch (error) {
    log.warn("admin_notify_failed", {
      quotationId: record.id,
      error: error instanceof Error ? error.message : "unknown",
    });
  }
}

async function scheduleAutoSend(
  record: QuotationRecord,
  store: QuotationStore,
): Promise<QuotationRecord> {
  const outcome = await scheduleDispatch(record);
  const updated = await store.update(record.id, (current) => ({
    ...current,
    scheduler: outcome.scheduler,
    scheduledJobId: outcome.jobId,
  }));
  return updated ?? record;
}
