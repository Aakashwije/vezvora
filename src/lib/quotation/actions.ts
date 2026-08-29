"use server";

/**
 * Admin server actions for quotations.
 *
 * Every action re-checks the session with `requireAdmin()` — the proxy redirect
 * is UX only — and every state change is written through the store's per-record
 * lock so an administrator and the auto-send worker cannot race.
 */

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { getSession } from "../admin/session.ts";
import { applyEditPatch, diffQuotation, normalizeEditPatch } from "./admin.ts";
import { dispatchQuotation } from "./dispatch.ts";
import { mailer } from "./email.ts";
import { log, safeErrorMessage } from "./log.ts";
import { renderQuotationPdf } from "./pdf.ts";
import { normalizePricingConfig } from "./pricing-config.ts";
import { quotationStore } from "./store.ts";
import type { QuotationRecord, QuotationStatus } from "./types.ts";

export type ActionResult = { ok: true; message: string } | { ok: false; error: string };

async function requireAdmin() {
  const user = await getSession();
  if (!user) throw new Error("Unauthorized");
  return user;
}

function revalidateQuotations(id?: string) {
  revalidatePath("/admin/quotations");
  if (id) revalidatePath(`/admin/quotations/${id}`);
  revalidatePath("/admin");
}

function activityEntry(actor: string, action: string, detail?: string) {
  return { id: `ac_${randomUUID()}`, at: new Date().toISOString(), actor, action, detail };
}

/** Statuses an administrator may set directly (never `sending` or `sent`). */
const MANUAL_STATUSES: QuotationStatus[] = ["pending_review", "approved", "held", "cancelled"];

export async function setQuotationStatusAction(
  id: string,
  status: QuotationStatus,
): Promise<ActionResult> {
  const user = await requireAdmin();
  if (!MANUAL_STATUSES.includes(status)) {
    return { ok: false, error: "That status cannot be set manually." };
  }

  try {
    const updated = await quotationStore().update(id, (record) => {
      // A quotation that already went out is final.
      if (record.status === "sent" || record.status === "sending") return null;
      return {
        ...record,
        status,
        activity: [...record.activity, activityEntry(user.name, `status_${status}`)],
      };
    });

    if (!updated) return { ok: false, error: "This quotation can no longer be changed." };
    log.info("admin_status_changed", { quotationId: id, number: updated.number, status, actor: user.name });
    revalidateQuotations(id);
    return { ok: true, message: `Marked as ${status.replace("_", " ")}.` };
  } catch (error) {
    log.error("admin_status_failed", { quotationId: id, error: safeErrorMessage(error) });
    return { ok: false, error: "Could not update the quotation. Please try again." };
  }
}

export async function saveQuotationAction(id: string, patch: unknown): Promise<ActionResult> {
  const user = await requireAdmin();
  const store = quotationStore();

  try {
    const config = await store.getPricingConfig();
    let changeCount = 0;

    const updated = await store.update(id, (record) => {
      if (record.status === "sent" || record.status === "sending") return null;

      const normalized = normalizeEditPatch(patch, record);
      const document = applyEditPatch(record, normalized, config);
      const changes = diffQuotation(record, document, normalized.adminNotes);
      changeCount = changes.length;
      if (changes.length === 0) return null;

      const revision = record.revision + 1;
      return {
        ...record,
        document,
        adminNotes: normalized.adminNotes,
        revision,
        // An edit invalidates the stored PDF fingerprint; it regenerates on demand.
        pdfHash: null,
        pdfGeneratedAt: null,
        status: record.status === "pending_review" ? "updated" : record.status,
        revisions: [
          ...record.revisions,
          {
            revision,
            at: new Date().toISOString(),
            actor: user.name,
            action: "edited",
            changes,
          },
        ],
        activity: [
          ...record.activity,
          activityEntry(user.name, "edited", `${changes.length} change(s)`),
        ],
      };
    });

    if (!updated) {
      return changeCount === 0
        ? { ok: true, message: "No changes to save." }
        : { ok: false, error: "This quotation can no longer be edited." };
    }

    log.info("admin_edited", {
      quotationId: id,
      number: updated.number,
      revision: updated.revision,
      changes: changeCount,
      actor: user.name,
    });
    revalidateQuotations(id);
    return { ok: true, message: `Saved as revision ${updated.revision}.` };
  } catch (error) {
    log.error("admin_edit_failed", { quotationId: id, error: safeErrorMessage(error) });
    return { ok: false, error: "Could not save your changes. Please try again." };
  }
}

export async function sendQuotationNowAction(id: string): Promise<ActionResult> {
  const user = await requireAdmin();
  const result = await dispatchQuotation(
    { store: quotationStore(), mailer: mailer() },
    { id, trigger: "manual", actor: user.name },
  );
  revalidateQuotations(id);
  return describeDispatch(result);
}

export async function retryQuotationEmailAction(id: string): Promise<ActionResult> {
  const user = await requireAdmin();
  const result = await dispatchQuotation(
    { store: quotationStore(), mailer: mailer() },
    { id, trigger: "retry", actor: user.name },
  );
  revalidateQuotations(id);
  return describeDispatch(result);
}

function describeDispatch(result: Awaited<ReturnType<typeof dispatchQuotation>>): ActionResult {
  if ("sent" in result && result.sent) {
    return { ok: true, message: "Quotation emailed to the customer." };
  }
  if ("failed" in result) {
    return { ok: false, error: "The email provider rejected the message. You can retry." };
  }
  const reasons: Record<string, string> = {
    not_found: "That quotation no longer exists.",
    not_due: "The review window has not closed yet.",
    not_sendable: "This quotation is not in a sendable state.",
    already_sent: "This quotation has already been sent.",
    in_flight: "A send is already in progress.",
    locked: "The quotation is busy. Please try again in a moment.",
  };
  return { ok: false, error: reasons[result.skipped] ?? "Nothing to send." };
}

export async function regenerateQuotationPdfAction(id: string): Promise<ActionResult> {
  const user = await requireAdmin();
  try {
    const record = await quotationStore().get(id);
    if (!record) return { ok: false, error: "That quotation no longer exists." };

    const pdf = await renderQuotationPdf(record);
    await quotationStore().update(id, (current) => ({
      ...current,
      pdfGeneratedAt: new Date().toISOString(),
      pdfHash: pdf.hash,
      activity: [
        ...current.activity,
        activityEntry(user.name, "pdf_regenerated", `${pdf.bytes.byteLength} bytes`),
      ],
    }));

    revalidateQuotations(id);
    return {
      ok: true,
      message: pdf.usedLetterhead
        ? "PDF regenerated."
        : "PDF regenerated using the fallback layout — the letterhead image is missing.",
    };
  } catch (error) {
    log.error("pdf_regenerate_failed", { quotationId: id, error: safeErrorMessage(error) });
    return { ok: false, error: "Could not regenerate the PDF." };
  }
}

export async function saveAdminNotesAction(id: string, notes: string): Promise<ActionResult> {
  const user = await requireAdmin();
  const clean = String(notes ?? "").replace(/[<>]/g, "").slice(0, 4_000);
  try {
    const updated = await quotationStore().update(id, (record) => ({
      ...record,
      adminNotes: clean,
      activity: [...record.activity, activityEntry(user.name, "notes_updated")],
    }));
    if (!updated) return { ok: false, error: "That quotation no longer exists." };
    revalidateQuotations(id);
    return { ok: true, message: "Notes saved." };
  } catch (error) {
    log.error("admin_notes_failed", { quotationId: id, error: safeErrorMessage(error) });
    return { ok: false, error: "Could not save your notes." };
  }
}

/**
 * Replace the stored rate card. Normalization means a malformed edit degrades
 * to the defaults for the offending fields instead of producing NaN prices.
 */
export async function savePricingConfigAction(raw: string): Promise<ActionResult> {
  const user = await requireAdmin();
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, error: "That is not valid JSON." };
  }

  try {
    const saved = await quotationStore().savePricingConfig(normalizePricingConfig(parsed));
    log.info("pricing_config_saved", { version: saved.version, actor: user.name });
    revalidatePath("/admin/quotations/pricing");
    return { ok: true, message: `Saved as pricing version ${saved.version}.` };
  } catch (error) {
    log.error("pricing_config_failed", { error: safeErrorMessage(error) });
    return { ok: false, error: "Could not save the pricing rules." };
  }
}

/** Read-through for client components that need a fresh record after a mutation. */
export async function getQuotationAction(id: string): Promise<QuotationRecord | null> {
  await requireAdmin();
  return quotationStore().get(id);
}
