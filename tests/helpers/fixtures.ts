import { calculateQuotation } from "../../src/lib/quotation/pricing.ts";
import { DEFAULT_PRICING_CONFIG } from "../../src/lib/quotation/pricing-config.ts";
import type {
  QuotationRecord,
  QuotationRequirements,
} from "../../src/lib/quotation/types.ts";

export function requirements(
  overrides: Partial<QuotationRequirements> = {},
): QuotationRequirements {
  return {
    contactName: "Sahan Perera",
    companyName: "Lanka Digital",
    email: "sahan@example.lk",
    phone: "+94 77 123 4567",
    projectName: "Ceylon Retail POS",
    service: "pos_system",
    description:
      "A point of sale and inventory platform for a twelve branch retail chain. Cashiers need offline billing at the counter with nightly stock synchronisation, head office needs consolidated sales and margin reporting, and finance needs each day takings posted into the existing accounting system automatically.",
    platforms: ["web", "pos_terminal", "android"],
    features: ["auth", "roles", "payments", "inventory", "reporting", "offline"],
    integrations: ["payment_gateway", "accounting"],
    design: "standard",
    userVolume: "medium",
    timeline: "standard",
    maintenance: "standard",
    budget: "1m_2_5m",
    notes: "",
    consent: true,
    ...overrides,
  };
}

/** A complete record shaped exactly as the store would hold it. */
export function record(overrides: Partial<QuotationRecord> = {}): QuotationRecord {
  const requirementsValue = overrides.requirements ?? requirements();
  const createdAt = overrides.createdAt ?? "2026-08-29T09:00:00.000Z";
  return {
    id: "qt_11111111-2222-3333-4444-555555555555",
    number: "VZQ-2026-0001",
    status: "pending_review",
    requirements: requirementsValue,
    document: calculateQuotation(requirementsValue, DEFAULT_PRICING_CONFIG),
    revision: 0,
    pdfGeneratedAt: null,
    pdfHash: null,
    createdAt,
    updatedAt: createdAt,
    reviewDeadline: new Date(new Date(createdAt).getTime() + 10 * 60_000).toISOString(),
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
    activity: [],
    source: "Instant estimate",
    scheduledJobId: null,
    scheduler: "none",
    ...overrides,
  };
}

/** Input shape accepted by `QuotationStore.create` (id/number are assigned). */
export function createInput(overrides: Partial<QuotationRecord> = {}) {
  const full: Record<string, unknown> = { ...record(overrides) };
  for (const assignedByTheStore of ["id", "number", "updatedAt"]) {
    delete full[assignedByTheStore];
  }
  return full as Omit<QuotationRecord, "id" | "number" | "updatedAt">;
}
