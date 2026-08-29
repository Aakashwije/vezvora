/** Domain types for the Instant Estimate quotation system. */

import type {
  BudgetBand,
  DesignScope,
  FeatureKey,
  IntegrationKey,
  MaintenancePlan,
  Platform,
  ServiceCategory,
  Timeline,
  UserVolume,
} from "../../content/quotation-options.ts";

export const QUOTATION_STATUSES = [
  "pending_review",
  "updated",
  "approved",
  "held",
  "cancelled",
  "sending",
  "sent",
  "failed",
] as const;

export type QuotationStatus = (typeof QUOTATION_STATUSES)[number];

/**
 * Statuses the automatic worker is allowed to send from.
 *
 * `held` and `cancelled` are the explicit "do not send" decisions; `sending`,
 * `sent` and `failed` have already been through delivery (a failed send is
 * retried by an administrator, never silently by the worker). An admin edit
 * (`updated`) or approval does not withhold the estimate the customer was
 * promised, so those still go out at the deadline.
 */
export const AUTO_SENDABLE_STATUSES: QuotationStatus[] = [
  "pending_review",
  "updated",
  "approved",
];

/** Raw, validated requirements exactly as the customer submitted them. */
export type QuotationRequirements = {
  contactName: string;
  companyName: string;
  email: string;
  phone: string;
  projectName: string;
  service: ServiceCategory;
  description: string;
  platforms: Platform[];
  features: FeatureKey[];
  integrations: IntegrationKey[];
  design: DesignScope;
  userVolume: UserVolume;
  timeline: Timeline;
  maintenance: MaintenancePlan;
  budget: BudgetBand;
  notes: string;
  consent: true;
};

export type QuotationLineItem = {
  id: string;
  /** Grouping used for ordering and for percentage-derived recalculation. */
  category:
    | "core"
    | "platform"
    | "feature"
    | "integration"
    | "design"
    | "scalability"
    | "delivery"
    | "maintenance"
    | "contingency";
  description: string;
  detail?: string;
  quantity: number;
  unitPrice: number;
  /** quantity × unitPrice, rounded by the engine. */
  total: number;
};

export type QuotationTotals = {
  currency: string;
  subtotal: number;
  discountLabel: string | null;
  discountPct: number;
  discountAmount: number;
  taxLabel: string;
  taxPct: number;
  taxAmount: number;
  total: number;
  /** Presented price band — the headline figure customers see. */
  rangeLow: number;
  rangeHigh: number;
  rangeSpreadPct: number;
  /** Money granularity used by the engine, so the console preview matches. */
  roundTo: number;
};

export type QuotationSchedule = {
  /** Best-case and worst-case delivery, in weeks. */
  deliveryWeeksLow: number;
  deliveryWeeksHigh: number;
  deliveryLabel: string;
};

export type PaymentMilestone = { label: string; pct: number; amount: number };

/** The complete, self-contained document model the PDF is rendered from. */
export type QuotationDocument = {
  lineItems: QuotationLineItem[];
  totals: QuotationTotals;
  schedule: QuotationSchedule;
  paymentSchedule: PaymentMilestone[];
  assumptions: string[];
  exclusions: string[];
  scopeSummary: string;
  validityDays: number;
  disclaimer: string;
  /** Pricing config version the figures were produced from. */
  pricingVersion: number;
};

export type QuotationRevision = {
  revision: number;
  at: string; // ISO
  actor: string;
  action: string;
  /** Human-readable field-level changes, e.g. "Tax: 0% → 18%". */
  changes: string[];
  note?: string;
};

export type QuotationActivity = {
  id: string;
  at: string; // ISO
  actor: string;
  action: string;
  detail?: string;
};

export type EmailDelivery = {
  state: "not_sent" | "sending" | "sent" | "failed";
  provider: string | null;
  messageId: string | null;
  attempts: number;
  lastAttemptAt: string | null;
  lastError: string | null;
  /** Guards against a duplicate send from a retried job. */
  idempotencyKey: string | null;
};

export type QuotationRecord = {
  id: string;
  number: string; // VZQ-2026-0001
  status: QuotationStatus;
  requirements: QuotationRequirements;
  document: QuotationDocument;
  revision: number;
  /** Reproducible PDF input: the document is regenerated on demand. */
  pdfGeneratedAt: string | null;
  pdfHash: string | null;
  createdAt: string; // ISO
  updatedAt: string; // ISO
  reviewDeadline: string; // ISO
  sentAt: string | null;
  /** Set once the worker or an admin claims the send; blocks duplicates. */
  sendClaimedAt: string | null;
  adminNotes: string;
  email: EmailDelivery;
  revisions: QuotationRevision[];
  activity: QuotationActivity[];
  /** Source page, kept for analytics parity with leads. */
  source: string;
  /** Job scheduling bookkeeping. */
  scheduledJobId: string | null;
  scheduler: "qstash" | "cron" | "none";
};

/** Compact projection used by the admin list view. */
export type QuotationSummary = Pick<
  QuotationRecord,
  | "id"
  | "number"
  | "status"
  | "revision"
  | "createdAt"
  | "reviewDeadline"
  | "sentAt"
> & {
  contactName: string;
  companyName: string;
  email: string;
  projectName: string;
  service: ServiceCategory;
  currency: string;
  rangeLow: number;
  rangeHigh: number;
  total: number;
  emailState: EmailDelivery["state"];
};

export function toSummary(record: QuotationRecord): QuotationSummary {
  return {
    id: record.id,
    number: record.number,
    status: record.status,
    revision: record.revision,
    createdAt: record.createdAt,
    reviewDeadline: record.reviewDeadline,
    sentAt: record.sentAt,
    contactName: record.requirements.contactName,
    companyName: record.requirements.companyName,
    email: record.requirements.email,
    projectName: record.requirements.projectName,
    service: record.requirements.service,
    currency: record.document.totals.currency,
    rangeLow: record.document.totals.rangeLow,
    rangeHigh: record.document.totals.rangeHigh,
    total: record.document.totals.total,
    emailState: record.email.state,
  };
}
