/**
 * Pricing rules for the estimation engine.
 *
 * These defaults are the seed only — the live configuration is persisted by the
 * quotation store and is editable from the admin console, so rates can change
 * without a code deploy. Nothing in this module may be imported by a client
 * component: prices are calculated on the server and the client never sees a
 * rate card.
 */

import {
  DESIGN_SCOPES,
  FEATURES,
  INTEGRATIONS,
  MAINTENANCE_PLANS,
  PLATFORMS,
  SERVICE_CATEGORIES,
  TIMELINES,
  USER_VOLUMES,
  type DesignScope,
  type FeatureKey,
  type IntegrationKey,
  type MaintenancePlan,
  type Platform,
  type ServiceCategory,
  type Timeline,
  type UserVolume,
} from "../../content/quotation-options.ts";

export type DiscountTier = { minSubtotal: number; pct: number; label: string };
export type ComplexityStep = { minFeatures: number; multiplier: number };
export type PaymentTerm = { label: string; pct: number };

/**
 * When an estimate may be emailed without a human seeing it first.
 *
 * Ordinary, well-specified, lower-value work goes out automatically at the
 * review deadline. Anything expensive, bespoke or thinly described waits for an
 * administrator to approve it. Stored with the rate card so the thresholds can
 * be tuned from the console without a deploy.
 */
export type AutoSendRules = {
  /** Master switch. When false every estimate waits for manual approval. */
  enabled: boolean;
  /** Estimates whose upper bound reaches this value always wait. */
  maxTotal: number;
  /** Confidence score (0-100) an estimate must reach to send automatically. */
  minScore: number;
  /** Service categories that are inherently bespoke and always wait. */
  holdServices: ServiceCategory[];
  minDescriptionChars: number;
  minFeatures: number;
  maxIntegrations: number;
  maxPlatforms: number;
};

export type PricingConfig = {
  /** Bumped whenever rates change; stamped onto every generated document. */
  version: number;
  currency: string;
  locale: string;

  baseByService: Record<ServiceCategory, number>;
  /** Platforms covered by the base price before per-platform pricing starts. */
  platformsIncluded: number;
  platformPrice: Record<Platform, number>;

  featurePrice: Record<FeatureKey, number>;
  /** Superlinear uplift once a build carries many interacting features. */
  featureComplexitySteps: ComplexityStep[];

  integrationPrice: Record<IntegrationKey, number>;
  designPrice: Record<DesignScope, number>;
  scalabilityPrice: Record<UserVolume, number>;
  maintenancePrice: Record<MaintenancePlan, number>;

  /** Percentages of the engineering subtotal, expressed 0–1. */
  qaPct: number;
  projectManagementPct: number;
  contingencyPct: number;
  timelineSurchargePct: Record<Timeline, number>;

  taxLabel: string;
  taxPct: number;
  discountTiers: DiscountTier[];

  baseWeeksByService: Record<ServiceCategory, number>;
  weeksPerFeature: number;
  weeksPerIntegration: number;
  weeksPerExtraPlatform: number;
  /** Schedule compression factor per urgency, expressed 0–1. */
  timelineCompression: Record<Timeline, number>;
  /** Width of the presented band, as a fraction of the total. */
  rangeSpreadPct: number;
  /** Wider band when the brief is thin. */
  lowConfidenceSpreadPct: number;
  minimumTotal: number;
  /** Every money figure is rounded to this granularity. */
  roundTo: number;
  validityDays: number;
  paymentSchedule: PaymentTerm[];
  autoSend: AutoSendRules;
};

export const DEFAULT_PRICING_CONFIG: PricingConfig = {
  version: 1,
  currency: "LKR",
  locale: "en-LK",

  baseByService: {
    website: 450_000,
    mobile_app: 950_000,
    pos_system: 1_200_000,
    saas_platform: 1_600_000,
    custom_system: 1_100_000,
    ui_ux: 350_000,
    other: 700_000,
  },
  platformsIncluded: 1,
  platformPrice: {
    web: 180_000,
    ios: 320_000,
    android: 300_000,
    desktop: 380_000,
    pos_terminal: 260_000,
    tablet: 160_000,
    api: 220_000,
  },

  featurePrice: {
    auth: 120_000,
    roles: 110_000,
    payments: 260_000,
    admin_dashboard: 240_000,
    realtime: 280_000,
    notifications: 140_000,
    search: 150_000,
    reporting: 220_000,
    multi_language: 130_000,
    multi_tenant: 320_000,
    offline: 300_000,
    inventory: 260_000,
    booking: 230_000,
    documents: 160_000,
    maps: 170_000,
    ai: 420_000,
  },
  featureComplexitySteps: [
    { minFeatures: 6, multiplier: 1.08 },
    { minFeatures: 10, multiplier: 1.16 },
    { minFeatures: 14, multiplier: 1.24 },
  ],

  integrationPrice: {
    payment_gateway: 160_000,
    sms: 90_000,
    whatsapp: 120_000,
    email_marketing: 80_000,
    accounting: 180_000,
    erp_crm: 240_000,
    logistics: 150_000,
    social_login: 70_000,
    analytics: 60_000,
    custom_api: 190_000,
  },
  designPrice: {
    template: 90_000,
    standard: 260_000,
    premium: 480_000,
    brand: 720_000,
  },
  scalabilityPrice: {
    small: 0,
    medium: 180_000,
    large: 420_000,
    xlarge: 850_000,
  },
  maintenancePrice: {
    none: 0,
    basic: 90_000,
    standard: 360_000,
    premium: 720_000,
  },

  qaPct: 0.12,
  projectManagementPct: 0.1,
  contingencyPct: 0.08,
  timelineSurchargePct: {
    flexible: 0,
    standard: 0,
    fast: 0.1,
    urgent: 0.2,
  },

  taxLabel: "VAT",
  taxPct: 0.18,
  discountTiers: [
    { minSubtotal: 3_000_000, pct: 0.07, label: "Enterprise programme discount" },
    { minSubtotal: 1_800_000, pct: 0.05, label: "Multi-module discount" },
  ],

  baseWeeksByService: {
    website: 5,
    mobile_app: 10,
    pos_system: 12,
    saas_platform: 14,
    custom_system: 11,
    ui_ux: 4,
    other: 8,
  },
  weeksPerFeature: 0.7,
  weeksPerIntegration: 0.4,
  weeksPerExtraPlatform: 1.5,
  timelineCompression: {
    flexible: 1.1,
    standard: 1,
    fast: 0.85,
    urgent: 0.75,
  },
  rangeSpreadPct: 0.12,
  lowConfidenceSpreadPct: 0.2,
  minimumTotal: 250_000,
  roundTo: 500,
  validityDays: 30,
  paymentSchedule: [
    { label: "On signing — mobilisation & discovery", pct: 0.3 },
    { label: "On design sign-off", pct: 0.2 },
    { label: "On development milestone completion", pct: 0.3 },
    { label: "On delivery & handover", pct: 0.2 },
  ],
  autoSend: {
    enabled: true,
    // Above roughly this figure the number itself warrants a conversation.
    maxTotal: 2_500_000,
    minScore: 70,
    holdServices: ["custom_system", "other"],
    minDescriptionChars: 220,
    minFeatures: 3,
    maxIntegrations: 6,
    maxPlatforms: 3,
  },
};

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

/** Merge a stored numeric rate map over the defaults, ignoring junk keys. */
function mergeRates<K extends string>(
  keys: readonly K[],
  defaults: Record<K, number>,
  stored: unknown,
): Record<K, number> {
  const source = (stored ?? {}) as Record<string, unknown>;
  const merged = { ...defaults };
  for (const key of keys) {
    const value = source[key];
    if (isFiniteNumber(value) && value >= 0) merged[key] = value;
  }
  return merged;
}

function mergePct(stored: unknown, fallback: number): number {
  return isFiniteNumber(stored) && stored >= 0 && stored <= 1 ? stored : fallback;
}

function mergePositive(stored: unknown, fallback: number): number {
  return isFiniteNumber(stored) && stored > 0 ? stored : fallback;
}

/**
 * Normalise the automatic-send rules. Anything unparseable falls back to the
 * default, and `enabled` must be an explicit `false` to switch sending off —
 * a corrupt blob must not disable the workflow by accident.
 */
function mergeAutoSend(stored: unknown, fallback: AutoSendRules): AutoSendRules {
  const source = (stored ?? {}) as Record<string, unknown>;
  const count = (value: unknown, min: number, max: number, defaultValue: number): number =>
    isFiniteNumber(value) ? Math.min(Math.max(Math.round(value), min), max) : defaultValue;

  const holdServices = Array.isArray(source.holdServices)
    ? source.holdServices.filter((entry): entry is ServiceCategory =>
        SERVICE_CATEGORIES.includes(entry as ServiceCategory),
      )
    : fallback.holdServices;

  return {
    enabled: source.enabled === undefined ? fallback.enabled : source.enabled !== false,
    maxTotal:
      isFiniteNumber(source.maxTotal) && source.maxTotal > 0 ? source.maxTotal : fallback.maxTotal,
    minScore: count(source.minScore, 0, 100, fallback.minScore),
    // De-duplicated so a repeated entry cannot bloat the stored config.
    holdServices: [...new Set(holdServices)],
    minDescriptionChars: count(source.minDescriptionChars, 0, 5_000, fallback.minDescriptionChars),
    minFeatures: count(source.minFeatures, 0, 64, fallback.minFeatures),
    maxIntegrations: count(source.maxIntegrations, 0, 64, fallback.maxIntegrations),
    maxPlatforms: count(source.maxPlatforms, 0, 64, fallback.maxPlatforms),
  };
}

/**
 * Coerce a persisted (and therefore untrusted) pricing blob into a complete,
 * well-formed config. Unknown or invalid entries fall back to the defaults so a
 * bad edit can never produce NaN prices.
 */
export function normalizePricingConfig(stored: unknown): PricingConfig {
  const source = (stored ?? {}) as Record<string, unknown>;
  const d = DEFAULT_PRICING_CONFIG;

  const discountTiers = Array.isArray(source.discountTiers)
    ? source.discountTiers
        .filter(
          (tier): tier is DiscountTier =>
            Boolean(tier) &&
            typeof tier === "object" &&
            isFiniteNumber((tier as DiscountTier).minSubtotal) &&
            isFiniteNumber((tier as DiscountTier).pct) &&
            typeof (tier as DiscountTier).label === "string",
        )
        .map((tier) => ({
          minSubtotal: Math.max(0, tier.minSubtotal),
          pct: Math.min(Math.max(tier.pct, 0), 0.5),
          label: tier.label.slice(0, 80),
        }))
        .sort((a, b) => b.minSubtotal - a.minSubtotal)
    : d.discountTiers;

  const paymentSchedule = Array.isArray(source.paymentSchedule)
    ? source.paymentSchedule
        .filter(
          (term): term is PaymentTerm =>
            Boolean(term) &&
            typeof term === "object" &&
            isFiniteNumber((term as PaymentTerm).pct) &&
            typeof (term as PaymentTerm).label === "string",
        )
        .map((term) => ({ label: term.label.slice(0, 120), pct: Math.min(Math.max(term.pct, 0), 1) }))
    : d.paymentSchedule;

  const complexitySteps = Array.isArray(source.featureComplexitySteps)
    ? source.featureComplexitySteps
        .filter(
          (step): step is ComplexityStep =>
            Boolean(step) &&
            typeof step === "object" &&
            isFiniteNumber((step as ComplexityStep).minFeatures) &&
            isFiniteNumber((step as ComplexityStep).multiplier),
        )
        .map((step) => ({
          minFeatures: Math.max(0, Math.round(step.minFeatures)),
          multiplier: Math.min(Math.max(step.multiplier, 1), 3),
        }))
        .sort((a, b) => a.minFeatures - b.minFeatures)
    : d.featureComplexitySteps;

  return {
    version: isFiniteNumber(source.version) ? source.version : d.version,
    currency: typeof source.currency === "string" && source.currency ? source.currency.slice(0, 8) : d.currency,
    locale: typeof source.locale === "string" && source.locale ? source.locale.slice(0, 16) : d.locale,

    baseByService: mergeRates(SERVICE_CATEGORIES, d.baseByService, source.baseByService),
    platformsIncluded: isFiniteNumber(source.platformsIncluded)
      ? Math.max(0, Math.round(source.platformsIncluded))
      : d.platformsIncluded,
    platformPrice: mergeRates(PLATFORMS, d.platformPrice, source.platformPrice),

    featurePrice: mergeRates(FEATURES, d.featurePrice, source.featurePrice),
    featureComplexitySteps: complexitySteps.length ? complexitySteps : d.featureComplexitySteps,

    integrationPrice: mergeRates(INTEGRATIONS, d.integrationPrice, source.integrationPrice),
    designPrice: mergeRates(DESIGN_SCOPES, d.designPrice, source.designPrice),
    scalabilityPrice: mergeRates(USER_VOLUMES, d.scalabilityPrice, source.scalabilityPrice),
    maintenancePrice: mergeRates(MAINTENANCE_PLANS, d.maintenancePrice, source.maintenancePrice),

    qaPct: mergePct(source.qaPct, d.qaPct),
    projectManagementPct: mergePct(source.projectManagementPct, d.projectManagementPct),
    contingencyPct: mergePct(source.contingencyPct, d.contingencyPct),
    timelineSurchargePct: mergeRates(TIMELINES, d.timelineSurchargePct, source.timelineSurchargePct),

    taxLabel: typeof source.taxLabel === "string" ? source.taxLabel.slice(0, 24) : d.taxLabel,
    taxPct: mergePct(source.taxPct, d.taxPct),
    discountTiers,

    baseWeeksByService: mergeRates(SERVICE_CATEGORIES, d.baseWeeksByService, source.baseWeeksByService),
    weeksPerFeature: mergePositive(source.weeksPerFeature, d.weeksPerFeature),
    weeksPerIntegration: mergePositive(source.weeksPerIntegration, d.weeksPerIntegration),
    weeksPerExtraPlatform: mergePositive(source.weeksPerExtraPlatform, d.weeksPerExtraPlatform),
    timelineCompression: mergeRates(TIMELINES, d.timelineCompression, source.timelineCompression),
    rangeSpreadPct: mergePct(source.rangeSpreadPct, d.rangeSpreadPct),
    lowConfidenceSpreadPct: mergePct(source.lowConfidenceSpreadPct, d.lowConfidenceSpreadPct),
    minimumTotal: isFiniteNumber(source.minimumTotal) && source.minimumTotal >= 0 ? source.minimumTotal : d.minimumTotal,
    roundTo: mergePositive(source.roundTo, d.roundTo),
    validityDays: isFiniteNumber(source.validityDays) && source.validityDays > 0
      ? Math.round(source.validityDays)
      : d.validityDays,
    paymentSchedule: paymentSchedule.length ? paymentSchedule : d.paymentSchedule,
    autoSend: mergeAutoSend(source.autoSend, d.autoSend),
  };
}
