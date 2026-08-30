/**
 * Dashboard aggregation.
 *
 * Pure functions over the two record sets the console already holds, so the
 * overview is assembled on the server and unit-tested without a store or a
 * browser.
 *
 * Leads and quotations are still separate systems. They are joined here on the
 * customer's email address, which is the only identity both carry — enough for
 * a conversion figure, and the natural key for a customer record later.
 */

import {
  isQueuedForAutoSend,
  mayAutoSend,
  type QuotationRecord,
} from "../quotation/types.ts";
import { needsApproval } from "../quotation/status-meta.ts";
import type { Lead } from "./types.ts";

/* ------------------------------------------------------------ date range */

export const RANGE_PRESETS = ["7d", "30d", "90d"] as const;
export type RangePreset = (typeof RANGE_PRESETS)[number];
export type RangeKey = RangePreset | "custom";

export type DateRange = {
  key: RangeKey;
  /** Inclusive start, ISO. */
  from: string;
  /** Exclusive end, ISO. */
  to: string;
  days: number;
  label: string;
};

const PRESET_DAYS: Record<RangePreset, number> = { "7d": 7, "30d": 30, "90d": 90 };
const DAY_MS = 86_400_000;
const MAX_CUSTOM_DAYS = 366 * 5;

function startOfDay(value: Date): Date {
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
}

/** Parse a `YYYY-MM-DD` control value; anything else is rejected. */
function parseDay(value: string | undefined): Date | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function preset(key: RangePreset, now: Date): DateRange {
  const days = PRESET_DAYS[key];
  const to = new Date(startOfDay(now).getTime() + DAY_MS);
  return {
    key,
    from: new Date(to.getTime() - days * DAY_MS).toISOString(),
    to: to.toISOString(),
    days,
    label: `Last ${days} days`,
  };
}

/**
 * Resolve the range controls into concrete bounds.
 *
 * Read from the URL, so a range is shareable and survives a refresh. Anything
 * malformed falls back to the 30-day default rather than erroring — these are
 * display controls, not a data mutation.
 */
export function resolveRange(
  params: { range?: string; from?: string; to?: string } = {},
  now: Date = new Date(),
): DateRange {
  if (params.range === "custom") {
    const from = parseDay(params.from);
    const to = parseDay(params.to);
    if (from && to && from.getTime() <= to.getTime()) {
      // The `to` control is an inclusive day, so the bound is the day after.
      const end = new Date(to.getTime() + DAY_MS);
      const days = Math.round((end.getTime() - from.getTime()) / DAY_MS);
      if (days <= MAX_CUSTOM_DAYS) {
        return {
          key: "custom",
          from: from.toISOString(),
          to: end.toISOString(),
          days,
          label: `${params.from} to ${params.to}`,
        };
      }
    }
    return preset("30d", now);
  }

  const key = RANGE_PRESETS.find((candidate) => candidate === params.range);
  return preset(key ?? "30d", now);
}

function within(iso: string, range: DateRange): boolean {
  const time = new Date(iso).getTime();
  return time >= new Date(range.from).getTime() && time < new Date(range.to).getTime();
}

/* --------------------------------------------------------- action centre */

/** Anything queued to send inside this window is treated as going out now. */
export const SENDING_SOON_MS = 10 * 60_000;
/** A lead in progress with no movement for this long has gone quiet. */
export const LEAD_FOLLOW_UP_DAYS = 5;

export type ActionSeverity = "critical" | "urgent" | "attention";

export type ActionKind =
  | "quotation_failed"
  | "quotation_sending_soon"
  | "quotation_approval"
  | "lead_unassigned"
  | "lead_stale";

/** The quick actions a row offers, resolved by the client component. */
export type ActionVerb = "review" | "approve" | "hold" | "send" | "retry" | "assign";

export type ActionItem = {
  id: string;
  kind: ActionKind;
  severity: ActionSeverity;
  /** Record the quick actions operate on. */
  targetId: string;
  title: string;
  subtitle: string;
  /** Why this is in the queue, in plain words. */
  reason: string;
  href: string;
  /** Orders items within a severity: the oldest has waited longest. */
  at: string;
  /** Present when the row should show a live countdown. */
  deadline: string | null;
  amount: { value: number; currency: string } | null;
  verbs: ActionVerb[];
};

const SEVERITY_ORDER: Record<ActionSeverity, number> = {
  critical: 0,
  urgent: 1,
  attention: 2,
};

function quotationSubtitle(record: QuotationRecord): string {
  const { contactName, companyName, projectName } = record.requirements;
  const who = companyName || contactName;
  return `${projectName} · ${who}`;
}

function daysSince(iso: string, now: number): number {
  return Math.floor((now - new Date(iso).getTime()) / DAY_MS);
}

/**
 * The work that needs a human today, most urgent first.
 *
 * Ordered by severity, then oldest-first inside each severity — the item that
 * has been waiting longest is the one most at risk of being forgotten.
 */
export function buildActionCentre(
  leads: Lead[],
  quotations: QuotationRecord[],
  now: number = Date.now(),
): ActionItem[] {
  const items: ActionItem[] = [];

  for (const record of quotations) {
    const currency = record.document.totals.currency;
    const amount = { value: record.document.totals.total, currency };
    const href = `/admin/quotations/${record.id}`;
    const base = {
      targetId: record.id,
      title: record.number,
      subtitle: quotationSubtitle(record),
      href,
      amount,
    };

    if (record.status === "failed" || record.email.state === "failed") {
      items.push({
        ...base,
        id: `qf_${record.id}`,
        kind: "quotation_failed",
        severity: "critical",
        reason: record.email.lastError
          ? `Delivery failed: ${record.email.lastError}`
          : "The provider rejected the email.",
        at: record.email.lastAttemptAt ?? record.updatedAt,
        deadline: null,
        verbs: ["review", "retry"],
      });
      continue;
    }

    if (needsApproval(record.status, mayAutoSend(record))) {
      items.push({
        ...base,
        id: `qa_${record.id}`,
        kind: "quotation_approval",
        severity: "urgent",
        reason: record.confidence.reviewReason ?? "Held for manual approval.",
        at: record.createdAt,
        deadline: null,
        verbs: ["review", "approve", "hold"],
      });
      continue;
    }

    if (
      isQueuedForAutoSend(record) &&
      new Date(record.reviewDeadline).getTime() <= now + SENDING_SOON_MS
    ) {
      items.push({
        ...base,
        id: `qs_${record.id}`,
        kind: "quotation_sending_soon",
        severity: "urgent",
        reason: "Emails the customer automatically when the review window closes.",
        at: record.createdAt,
        deadline: record.reviewDeadline,
        verbs: ["review", "hold", "send"],
      });
    }
  }

  for (const lead of leads) {
    const base = {
      targetId: lead.id,
      title: lead.name,
      subtitle: `${lead.projectType} · ${lead.company ?? lead.email}`,
      href: `/admin/leads?lead=${lead.id}`,
      amount: null,
    };

    if (lead.status === "new" && lead.assigneeId === null) {
      items.push({
        ...base,
        id: `lu_${lead.id}`,
        kind: "lead_unassigned",
        severity: "attention",
        reason: "New enquiry with nobody assigned to it.",
        at: lead.createdAt,
        deadline: null,
        verbs: ["review", "assign"],
      });
      continue;
    }

    const inProgress = lead.status === "contacted" || lead.status === "qualified";
    const idleDays = daysSince(lead.updatedAt, now);
    if (inProgress && idleDays >= LEAD_FOLLOW_UP_DAYS) {
      items.push({
        ...base,
        id: `ls_${lead.id}`,
        kind: "lead_stale",
        severity: "attention",
        reason: `No movement for ${idleDays} days.`,
        at: lead.updatedAt,
        deadline: null,
        verbs: ["review", "assign"],
      });
    }
  }

  return items.sort((a, b) => {
    const bySeverity = SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity];
    if (bySeverity !== 0) return bySeverity;
    return +new Date(a.at) - +new Date(b.at);
  });
}

export type ActionGroup = {
  kind: ActionKind;
  label: string;
  severity: ActionSeverity;
  items: ActionItem[];
};

const GROUP_LABEL: Record<ActionKind, string> = {
  quotation_failed: "Failed delivery",
  quotation_approval: "Needs approval",
  quotation_sending_soon: "Sending soon",
  lead_unassigned: "Unassigned leads",
  lead_stale: "Leads without follow-up",
};

/** Group the queue for display while preserving the urgency ordering. */
export function groupActionItems(items: ActionItem[]): ActionGroup[] {
  const order: ActionKind[] = [
    "quotation_failed",
    "quotation_approval",
    "quotation_sending_soon",
    "lead_unassigned",
    "lead_stale",
  ];
  return order
    .map((kind) => {
      const matching = items.filter((item) => item.kind === kind);
      return {
        kind,
        label: GROUP_LABEL[kind],
        severity: matching[0]?.severity ?? "attention",
        items: matching,
      };
    })
    .filter((group) => group.items.length > 0);
}

/* ------------------------------------------------------------------ KPIs */

export type DashboardKpis = {
  currency: string;
  /** Leads received inside the range. */
  newLeads: number;
  /** Quotations emailed to a customer inside the range. */
  quotationsSent: number;
  /** Snapshot, not range-bound: everything still in the review pipeline. */
  pendingValue: number;
  pendingCount: number;
  /** Mean quotation total for quotations raised inside the range. */
  averageValue: number;
  quotationsRaised: number;
  /** Leads in the range that went on to request an estimate. */
  convertedLeads: number;
  conversionPct: number | null;
  /** Submission to first administrator action, in minutes. */
  averageResponseMinutes: number | null;
  respondedCount: number;
};

/** Statuses that still represent unrealised pipeline value. */
const PENDING_STATUSES = ["pending_review", "updated", "approved", "held"] as const;

/**
 * When a person first touched the quotation.
 *
 * The submission entry is attributed to the customer and the worker's entries
 * are attributed to `System (...)`, so anything else is an administrator.
 */
function firstAdminActionAt(record: QuotationRecord): string | null {
  const entry = record.activity.find(
    (item) => item.actor !== record.requirements.contactName && !item.actor.startsWith("System"),
  );
  return entry?.at ?? null;
}

export function buildKpis(
  leads: Lead[],
  quotations: QuotationRecord[],
  range: DateRange,
): DashboardKpis {
  const currency = quotations[0]?.document.totals.currency ?? "LKR";

  const leadsInRange = leads.filter((lead) => within(lead.createdAt, range));
  const raisedInRange = quotations.filter((record) => within(record.createdAt, range));
  const sentInRange = quotations.filter(
    (record) => record.sentAt !== null && within(record.sentAt, range),
  );

  const pending = quotations.filter((record) =>
    (PENDING_STATUSES as readonly string[]).includes(record.status),
  );
  const pendingValue = pending.reduce((sum, record) => sum + record.document.totals.total, 0);

  const raisedValue = raisedInRange.reduce((sum, record) => sum + record.document.totals.total, 0);
  const averageValue = raisedInRange.length
    ? Math.round(raisedValue / raisedInRange.length)
    : 0;

  // Joined on email: the only identity a lead and a quotation share today.
  const quotationEmails = new Set(
    quotations.map((record) => record.requirements.email.trim().toLowerCase()),
  );
  const convertedLeads = leadsInRange.filter((lead) =>
    quotationEmails.has(lead.email.trim().toLowerCase()),
  ).length;

  const responseMinutes = raisedInRange
    .map((record) => {
      const at = firstAdminActionAt(record);
      if (!at) return null;
      return (new Date(at).getTime() - new Date(record.createdAt).getTime()) / 60_000;
    })
    .filter((value): value is number => value !== null && value >= 0);

  return {
    currency,
    newLeads: leadsInRange.length,
    quotationsSent: sentInRange.length,
    pendingValue,
    pendingCount: pending.length,
    averageValue,
    quotationsRaised: raisedInRange.length,
    convertedLeads,
    conversionPct: leadsInRange.length
      ? Math.round((convertedLeads / leadsInRange.length) * 100)
      : null,
    averageResponseMinutes: responseMinutes.length
      ? Math.round(responseMinutes.reduce((sum, value) => sum + value, 0) / responseMinutes.length)
      : null,
    respondedCount: responseMinutes.length,
  };
}

/** Compact money for a KPI tile: 1.9M / 240k / 950. */
export function compactMoney(value: number, currency: string): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${currency} ${(value / 1_000_000).toFixed(abs >= 10_000_000 ? 0 : 1)}M`;
  if (abs >= 1_000) return `${currency} ${Math.round(value / 1_000)}k`;
  return `${currency} ${Math.round(value)}`;
}

/** Compact duration for a KPI tile: 4m / 2h 10m / 3d. */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${Math.round(minutes)}m`;
  if (minutes < 60 * 24) {
    const hours = Math.floor(minutes / 60);
    const rest = Math.round(minutes % 60);
    return rest > 0 ? `${hours}h ${rest}m` : `${hours}h`;
  }
  const days = Math.floor(minutes / (60 * 24));
  const hours = Math.round((minutes % (60 * 24)) / 60);
  return hours > 0 ? `${days}d ${hours}h` : `${days}d`;
}
