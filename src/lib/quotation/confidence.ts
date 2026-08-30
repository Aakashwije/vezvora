/**
 * Confidence assessment and the automatic-send rule.
 *
 * Emailing every generated estimate at the deadline is only safe for ordinary,
 * well-specified, lower-value work. This module decides — deterministically, on
 * the server — whether a given quotation is one of those, or whether it should
 * wait for a human. The result is stored on the record so the console can show
 * exactly why something is waiting, and so the decision does not silently change
 * when the rate card is edited later.
 *
 * Pure functions only. Nothing here reads the environment or the store.
 */

import type { BudgetBand } from "../../content/quotation-options.ts";
import type { AutoSendRules } from "./pricing-config.ts";
import type { QuotationDocument, QuotationRequirements } from "./types.ts";

export type ConfidenceLevel = "high" | "medium" | "low";

/** Stable codes so tests and log queries do not depend on wording. */
export const CONFIDENCE_FLAGS = [
  "high_value",
  "bespoke_service",
  "thin_brief",
  "unscoped",
  "many_integrations",
  "many_platforms",
  "urgent_timeline",
  "budget_gap",
  "rules_disabled",
] as const;

export type ConfidenceFlagCode = (typeof CONFIDENCE_FLAGS)[number];

export type ConfidenceFlag = {
  code: ConfidenceFlagCode;
  /** Shown to administrators. Never contains a rate or a threshold value. */
  label: string;
  /** True when this alone withholds the automatic send, whatever the score. */
  blocking: boolean;
};

export type ConfidenceAssessment = {
  /** How much the estimate can be trusted, given what the customer told us. */
  level: ConfidenceLevel;
  /** 0–100. Starts at 100 and is reduced by each soft signal. */
  score: number;
  /** Whether the worker may send this without a human approving it first. */
  autoSend: boolean;
  flags: ConfidenceFlag[];
  /** One-line summary for the console and the admin notification email. */
  reviewReason: string | null;
  /** Rate-card version the decision was made against. */
  rulesVersion: number;
};

/**
 * Upper bound of each budget band, in LKR — these mirror the band labels the
 * customer chose from, so they are fixed by the form, not by the rate card.
 * `null` means the band carries no usable signal.
 */
const BUDGET_CEILING: Record<BudgetBand, number | null> = {
  undisclosed: null,
  under_500k: 500_000,
  "500k_1m": 1_000_000,
  "1m_2_5m": 2_500_000,
  "2_5m_5m": 5_000_000,
  over_5m: null,
};

/**
 * How far each soft signal moves the score. Blocking flags carry their own.
 *
 * `thin_brief` is weighted to withhold on its own: the engine already widens
 * the presented band when the description is short, and emailing a number the
 * estimator itself cannot price precisely is the thing this rule exists to
 * prevent.
 */
const WEIGHT: Record<ConfidenceFlagCode, number> = {
  high_value: 0,
  bespoke_service: 20,
  thin_brief: 35,
  unscoped: 20,
  many_integrations: 15,
  many_platforms: 15,
  urgent_timeline: 10,
  budget_gap: 20,
  rules_disabled: 0,
};

const LABEL: Record<ConfidenceFlagCode, string> = {
  high_value: "Estimate is above the value ceiling for automatic sending.",
  bespoke_service: "Bespoke service category — scope is rarely comparable.",
  thin_brief: "The project description is too short to price confidently.",
  unscoped: "Very few feature areas selected for this kind of build.",
  many_integrations: "Unusually many third-party integrations.",
  many_platforms: "Unusually many target platforms.",
  urgent_timeline: "Urgent timeline — compressed delivery needs a human check.",
  budget_gap: "The estimate sits above the customer's stated budget band.",
  rules_disabled: "Automatic sending is switched off for all estimates.",
};

function flag(code: ConfidenceFlagCode, blocking = false): ConfidenceFlag {
  return { code, label: LABEL[code], blocking };
}

function levelFor(score: number): ConfidenceLevel {
  if (score >= 80) return "high";
  if (score >= 55) return "medium";
  return "low";
}

/**
 * Assess a freshly priced quotation.
 *
 * `level`/`score` describe confidence in the numbers; `autoSend` is the separate
 * policy question. A large, perfectly specified project scores highly and is
 * still withheld, because its size — not its clarity — is what warrants review.
 */
export function assessConfidence(
  requirements: QuotationRequirements,
  document: QuotationDocument,
  rules: AutoSendRules,
): ConfidenceAssessment {
  const flags: ConfidenceFlag[] = [];

  /* Blocking signals: policy decisions that no score can override. */
  if (!rules.enabled) {
    flags.push(flag("rules_disabled", true));
  }
  if (document.totals.rangeHigh >= rules.maxTotal) {
    flags.push(flag("high_value", true));
  }
  if (rules.holdServices.includes(requirements.service)) {
    flags.push(flag("bespoke_service", true));
  }

  /* Soft signals: each reduces the confidence score. */
  if (requirements.description.trim().length < rules.minDescriptionChars) {
    flags.push(flag("thin_brief"));
  }
  if (requirements.features.length < rules.minFeatures) {
    flags.push(flag("unscoped"));
  }
  if (requirements.integrations.length > rules.maxIntegrations) {
    flags.push(flag("many_integrations"));
  }
  if (requirements.platforms.length > rules.maxPlatforms) {
    flags.push(flag("many_platforms"));
  }
  if (requirements.timeline === "urgent") {
    flags.push(flag("urgent_timeline"));
  }

  const ceiling = BUDGET_CEILING[requirements.budget];
  if (ceiling !== null && document.totals.rangeLow > ceiling) {
    flags.push(flag("budget_gap"));
  }

  const penalty = flags.reduce((sum, entry) => sum + WEIGHT[entry.code], 0);
  const score = Math.max(0, Math.min(100, 100 - penalty));
  const blocked = flags.some((entry) => entry.blocking);
  const autoSend = rules.enabled && !blocked && score >= rules.minScore;

  return {
    level: levelFor(score),
    score,
    autoSend,
    flags,
    reviewReason: autoSend ? null : summarise(flags, score, rules),
    rulesVersion: document.pricingVersion,
  };
}

function summarise(flags: ConfidenceFlag[], score: number, rules: AutoSendRules): string {
  const blocking = flags.find((entry) => entry.blocking);
  if (blocking) return blocking.label;
  if (flags.length > 0 && score < rules.minScore) {
    return flags.length === 1
      ? flags[0].label
      : `${flags[0].label} (and ${flags.length - 1} other signal${flags.length === 2 ? "" : "s"})`;
  }
  return "Held for manual approval.";
}

/**
 * The assessment to use for a record that predates this feature, or whose
 * stored blob is malformed. Withholding is the safe default: an estimate is
 * never emailed on the strength of missing data.
 */
export const UNASSESSED: ConfidenceAssessment = {
  level: "low",
  score: 0,
  autoSend: false,
  flags: [],
  reviewReason: "Not assessed — approve manually to send.",
  rulesVersion: 0,
};

/** Coerce a persisted (and therefore untrusted) assessment into a safe shape. */
export function normalizeConfidence(stored: unknown): ConfidenceAssessment {
  if (!stored || typeof stored !== "object") return UNASSESSED;
  const source = stored as Record<string, unknown>;

  const score =
    typeof source.score === "number" && Number.isFinite(source.score)
      ? Math.max(0, Math.min(100, Math.round(source.score)))
      : 0;

  const flags = Array.isArray(source.flags)
    ? source.flags
        .filter(
          (entry): entry is ConfidenceFlag =>
            Boolean(entry) &&
            typeof entry === "object" &&
            CONFIDENCE_FLAGS.includes((entry as ConfidenceFlag).code),
        )
        .map((entry) => flag(entry.code, Boolean(entry.blocking)))
    : [];

  return {
    level:
      source.level === "high" || source.level === "medium" || source.level === "low"
        ? source.level
        : levelFor(score),
    score,
    // Only an explicit `true` releases the send; anything else withholds it.
    autoSend: source.autoSend === true,
    flags,
    reviewReason:
      typeof source.reviewReason === "string" ? source.reviewReason.slice(0, 300) : null,
    rulesVersion:
      typeof source.rulesVersion === "number" && Number.isFinite(source.rulesVersion)
        ? source.rulesVersion
        : 0,
  };
}
