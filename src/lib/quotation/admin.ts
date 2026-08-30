/**
 * Administrator edit model.
 *
 * The console posts a patch of the fields an administrator may change. Prices
 * are recomputed here from the patched line items — the browser's arithmetic is
 * never trusted, and totals, status, number and review deadline are not part of
 * the patch at all.
 */

import { buildPaymentSchedule, recalculateTotals, roundMoney } from "./pricing.ts";
import type { PricingConfig } from "./pricing-config.ts";
import type {
  QuotationDocument,
  QuotationLineItem,
  QuotationRecord,
} from "./types.ts";

export const EDIT_LIMITS = {
  maxLineItems: 60,
  description: 160,
  detail: 200,
  label: 60,
  listItem: 400,
  maxListEntries: 20,
  scopeSummary: 1_200,
  adminNotes: 4_000,
  deliveryLabel: 80,
  maxUnitPrice: 1_000_000_000,
  maxQuantity: 9_999,
} as const;

export type QuotationEditPatch = {
  lineItems: Pick<
    QuotationLineItem,
    "id" | "category" | "description" | "detail" | "quantity" | "unitPrice"
  >[];
  discountPct: number;
  discountLabel: string;
  taxPct: number;
  taxLabel: string;
  assumptions: string[];
  exclusions: string[];
  scopeSummary: string;
  deliveryLabel: string;
  validityDays: number;
  adminNotes: string;
};

function text(value: unknown, maxLength: number): string {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .replace(/[<>]/g, "")
    .trim()
    .slice(0, maxLength);
}

function money(value: unknown, max: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  return Math.min(Math.round(parsed), max);
}

function pct(value: unknown): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  return Math.min(parsed, 1);
}

function list(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .slice(0, EDIT_LIMITS.maxListEntries)
    .map((entry) => text(entry, EDIT_LIMITS.listItem))
    .filter(Boolean);
}

const CATEGORIES: QuotationLineItem["category"][] = [
  "core",
  "platform",
  "feature",
  "integration",
  "design",
  "scalability",
  "delivery",
  "maintenance",
  "contingency",
];

/** Coerce an untrusted patch from the console into a safe, complete shape. */
export function normalizeEditPatch(input: unknown, fallback: QuotationRecord): QuotationEditPatch {
  const raw = (input ?? {}) as Record<string, unknown>;
  const rawItems = Array.isArray(raw.lineItems) ? raw.lineItems : [];

  const lineItems = rawItems
    .slice(0, EDIT_LIMITS.maxLineItems)
    .map((entry, index) => {
      const item = (entry ?? {}) as Record<string, unknown>;
      const category = CATEGORIES.includes(item.category as QuotationLineItem["category"])
        ? (item.category as QuotationLineItem["category"])
        : "feature";
      return {
        id: text(item.id, 64) || `custom:${index}`,
        category,
        description: text(item.description, EDIT_LIMITS.description),
        detail: text(item.detail, EDIT_LIMITS.detail) || undefined,
        quantity: Math.max(1, money(item.quantity, EDIT_LIMITS.maxQuantity)),
        unitPrice: money(item.unitPrice, EDIT_LIMITS.maxUnitPrice),
      };
    })
    .filter((item) => item.description.length > 0);

  const assumptions = list(raw.assumptions);
  const exclusions = list(raw.exclusions);
  const validityDaysRaw = Number(raw.validityDays);

  return {
    // An empty edit would produce a quotation with no scope; keep the original.
    lineItems: lineItems.length ? lineItems : fallback.document.lineItems,
    discountPct: pct(raw.discountPct),
    discountLabel: text(raw.discountLabel, EDIT_LIMITS.label) || "Discount",
    taxPct: pct(raw.taxPct),
    taxLabel: text(raw.taxLabel, EDIT_LIMITS.label) || fallback.document.totals.taxLabel,
    assumptions: assumptions.length ? assumptions : fallback.document.assumptions,
    exclusions: exclusions.length ? exclusions : fallback.document.exclusions,
    scopeSummary: text(raw.scopeSummary, EDIT_LIMITS.scopeSummary) || fallback.document.scopeSummary,
    deliveryLabel:
      text(raw.deliveryLabel, EDIT_LIMITS.deliveryLabel) || fallback.document.schedule.deliveryLabel,
    validityDays:
      Number.isFinite(validityDaysRaw) && validityDaysRaw > 0
        ? Math.min(Math.round(validityDaysRaw), 365)
        : fallback.document.validityDays,
    adminNotes: String(raw.adminNotes ?? "")
      .replace(/[<>]/g, "")
      .slice(0, EDIT_LIMITS.adminNotes),
  };
}

/** Rebuild the document from a patch, recomputing every derived figure. */
export function applyEditPatch(
  record: QuotationRecord,
  patch: QuotationEditPatch,
  config: PricingConfig,
): QuotationDocument {
  const lineItems: QuotationLineItem[] = patch.lineItems.map((item) => ({
    ...item,
    total: roundMoney(item.quantity * item.unitPrice, config.roundTo),
  }));

  const totals = recalculateTotals(lineItems, {
    config: { ...config, currency: record.document.totals.currency },
    discountPct: patch.discountPct,
    discountLabel: patch.discountLabel,
    taxPct: patch.taxPct,
    taxLabel: patch.taxLabel,
    rangeSpreadPct: record.document.totals.rangeSpreadPct,
  });

  return {
    ...record.document,
    lineItems,
    totals,
    schedule: { ...record.document.schedule, deliveryLabel: patch.deliveryLabel },
    paymentSchedule: buildPaymentSchedule(totals.total, config),
    assumptions: patch.assumptions,
    exclusions: patch.exclusions,
    scopeSummary: patch.scopeSummary,
    validityDays: patch.validityDays,
  };
}

function formatAmount(value: number, currency: string): string {
  return `${currency} ${Math.round(value).toLocaleString("en-US")}`;
}

/**
 * Field-level description of what an edit changed, stored on the revision so
 * the audit trail answers "who changed what, and when".
 */
export function diffQuotation(
  before: QuotationRecord,
  afterDocument: QuotationDocument,
  afterNotes: string,
): string[] {
  const changes: string[] = [];
  const currency = before.document.totals.currency;
  const beforeItems = new Map(before.document.lineItems.map((item) => [item.id, item]));
  const afterItems = new Map(afterDocument.lineItems.map((item) => [item.id, item]));

  for (const [id, item] of afterItems) {
    const previous = beforeItems.get(id);
    if (!previous) {
      changes.push(`Added "${item.description}" (${formatAmount(item.total, currency)})`);
      continue;
    }
    if (previous.description !== item.description) {
      changes.push(`Renamed "${previous.description}" to "${item.description}"`);
    }
    if (previous.quantity !== item.quantity) {
      changes.push(`"${item.description}" quantity ${previous.quantity} to ${item.quantity}`);
    }
    if (previous.unitPrice !== item.unitPrice) {
      changes.push(
        `"${item.description}" unit price ${formatAmount(previous.unitPrice, currency)} to ${formatAmount(item.unitPrice, currency)}`,
      );
    }
  }

  for (const [id, item] of beforeItems) {
    if (!afterItems.has(id)) {
      changes.push(`Removed "${item.description}"`);
    }
  }

  const beforeTotals = before.document.totals;
  const afterTotals = afterDocument.totals;
  if (beforeTotals.discountPct !== afterTotals.discountPct) {
    changes.push(
      `Discount ${Math.round(beforeTotals.discountPct * 100)}% to ${Math.round(afterTotals.discountPct * 100)}%`,
    );
  }
  if (beforeTotals.taxPct !== afterTotals.taxPct) {
    changes.push(
      `${afterTotals.taxLabel} ${Math.round(beforeTotals.taxPct * 100)}% to ${Math.round(afterTotals.taxPct * 100)}%`,
    );
  }
  if (beforeTotals.total !== afterTotals.total) {
    changes.push(
      `Total ${formatAmount(beforeTotals.total, currency)} to ${formatAmount(afterTotals.total, currency)}`,
    );
  }
  if (before.document.schedule.deliveryLabel !== afterDocument.schedule.deliveryLabel) {
    changes.push(
      `Delivery "${before.document.schedule.deliveryLabel}" to "${afterDocument.schedule.deliveryLabel}"`,
    );
  }
  if (before.document.validityDays !== afterDocument.validityDays) {
    changes.push(`Validity ${before.document.validityDays} to ${afterDocument.validityDays} days`);
  }
  if (before.document.scopeSummary !== afterDocument.scopeSummary) {
    changes.push("Updated project summary");
  }
  if (
    before.document.assumptions.join("|") !== afterDocument.assumptions.join("|")
  ) {
    changes.push("Updated assumptions");
  }
  if (before.document.exclusions.join("|") !== afterDocument.exclusions.join("|")) {
    changes.push("Updated exclusions");
  }
  if (before.adminNotes !== afterNotes) {
    changes.push("Updated internal notes");
  }

  return changes;
}
