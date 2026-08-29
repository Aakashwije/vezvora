"use server";

import { headers } from "next/headers";
import { createQuotation, isSubmissionRateLimited, toReceipt, type QuotationReceipt } from "@/lib/quotation/service";
import { log, safeErrorMessage } from "@/lib/quotation/log";
import {
  cleanText,
  submissionFromFormData,
  validateQuotation,
  type FieldErrors,
} from "@/lib/quotation/validation";

export type QuotationFormState = {
  ok?: boolean;
  receipt?: QuotationReceipt;
  error?: string;
  errors?: FieldErrors;
};

async function clientKey(): Promise<string> {
  const h = await headers();
  return (
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    "local"
  );
}

/**
 * Public entry point for the Instant Estimate form.
 *
 * The client sends requirements only — pricing, the quotation number, the
 * status and the review deadline are all decided server-side.
 */
export async function submitQuotation(
  _prev: QuotationFormState,
  formData: FormData,
): Promise<QuotationFormState> {
  // Honeypot: a field hidden from humans but attractive to form bots. Report
  // success so the bot does not learn it was filtered.
  if (cleanText(formData.get("website"), 120)) {
    log.warn("submission_honeypot", { key: await clientKey() });
    return { ok: true };
  }

  const key = await clientKey();
  if (await isSubmissionRateLimited(key)) {
    log.warn("submission_rate_limited", { key });
    return { error: "Too many estimate requests. Please try again in a few minutes." };
  }

  const validation = validateQuotation(submissionFromFormData(formData));
  if (!validation.ok) {
    return { error: validation.error, errors: validation.errors };
  }

  try {
    const record = await createQuotation(validation.payload, { source: "Instant estimate" });
    return { ok: true, receipt: toReceipt(record) };
  } catch (error) {
    log.error("submission_failed", { error: safeErrorMessage(error) });
    // Never surface storage or provider detail to the public form.
    return {
      error:
        "We could not generate your estimate just now. Please try again, or email us and we will send it manually.",
    };
  }
}
