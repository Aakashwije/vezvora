/**
 * Deterministic quotation engine.
 *
 * Pure functions only: the same requirements and the same `PricingConfig`
 * always produce the same document. The client submits requirements and
 * nothing else — every figure below is derived here, on the server.
 */

import {
  designLabel,
  featureLabel,
  integrationLabel,
  maintenanceLabel,
  platformLabel,
  serviceLabel,
  timelineLabel,
  volumeLabel,
} from "../../content/quotation-options.ts";
import type { PricingConfig } from "./pricing-config.ts";
import type {
  PaymentMilestone,
  QuotationDocument,
  QuotationLineItem,
  QuotationRequirements,
  QuotationSchedule,
  QuotationTotals,
} from "./types.ts";

export const APPROXIMATE_DISCLAIMER =
  "This is an approximate quotation based on the information provided. Final pricing and delivery dates may change after detailed requirement analysis and written confirmation.";

/** Round to the configured granularity; always returns a finite integer-ish value. */
export function roundMoney(value: number, roundTo: number): number {
  if (!Number.isFinite(value)) return 0;
  const step = roundTo > 0 ? roundTo : 1;
  return Math.round(value / step) * step;
}

/** Currency formatting shared by the admin console, the PDF and the emails. */
export function formatMoney(amount: number, currency: string, locale = "en-LK"): string {
  const safe = Number.isFinite(amount) ? amount : 0;
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(safe);
  } catch {
    // Unknown currency code — fall back to a plain grouped number.
    return `${currency} ${Math.round(safe).toLocaleString("en-US")}`;
  }
}

export function formatRange(low: number, high: number, currency: string, locale = "en-LK"): string {
  if (low === high) return formatMoney(low, currency, locale);
  return `${formatMoney(low, currency, locale)} – ${formatMoney(high, currency, locale)}`;
}

function line(
  item: Omit<QuotationLineItem, "total">,
  roundTo: number,
): QuotationLineItem {
  return { ...item, total: roundMoney(item.quantity * item.unitPrice, roundTo) };
}

function complexityMultiplier(featureCount: number, config: PricingConfig): number {
  let multiplier = 1;
  for (const step of config.featureComplexitySteps) {
    if (featureCount >= step.minFeatures) multiplier = step.multiplier;
  }
  return multiplier;
}

/**
 * How confident the estimate is, given how much the customer told us. A thin
 * brief widens the presented band rather than pretending to precision.
 */
function spreadFor(requirements: QuotationRequirements, config: PricingConfig): number {
  const describedWell = requirements.description.trim().length >= 220;
  const scopedWell = requirements.features.length >= 3;
  const confident = describedWell && scopedWell;
  return confident ? config.rangeSpreadPct : config.lowConfidenceSpreadPct;
}

/**
 * Recompute money totals from a set of line items. Used both when a quotation
 * is first generated and after an administrator edits quantities or prices.
 */
export function recalculateTotals(
  lineItems: QuotationLineItem[],
  options: {
    config: PricingConfig;
    discountPct: number;
    discountLabel: string | null;
    taxPct: number;
    taxLabel: string;
    rangeSpreadPct: number;
  },
): QuotationTotals {
  const { config, discountPct, discountLabel, taxPct, taxLabel, rangeSpreadPct } = options;
  const { roundTo, currency, minimumTotal } = config;

  const rawSubtotal = lineItems.reduce(
    (sum, item) => sum + roundMoney(item.quantity * item.unitPrice, roundTo),
    0,
  );
  const subtotal = Math.max(roundMoney(rawSubtotal, roundTo), 0);
  const discountAmount = roundMoney(subtotal * discountPct, roundTo);
  const net = Math.max(subtotal - discountAmount, 0);
  const taxAmount = roundMoney(net * taxPct, roundTo);
  const total = Math.max(roundMoney(net + taxAmount, roundTo), minimumTotal);

  return {
    currency,
    subtotal,
    discountLabel: discountAmount > 0 ? discountLabel : null,
    discountPct: discountAmount > 0 ? discountPct : 0,
    discountAmount,
    taxLabel,
    taxPct,
    taxAmount,
    total,
    rangeLow: roundMoney(total * (1 - rangeSpreadPct), roundTo),
    rangeHigh: roundMoney(total * (1 + rangeSpreadPct), roundTo),
    rangeSpreadPct,
    roundTo,
  };
}

export function buildPaymentSchedule(
  total: number,
  config: PricingConfig,
): PaymentMilestone[] {
  const terms = config.paymentSchedule;
  const milestones = terms.map((term) => ({
    label: term.label,
    pct: term.pct,
    amount: roundMoney(total * term.pct, config.roundTo),
  }));

  // Absorb rounding drift into the final milestone so the parts sum to the whole.
  const drift = total - milestones.reduce((sum, m) => sum + m.amount, 0);
  if (milestones.length > 0 && drift !== 0) {
    const last = milestones[milestones.length - 1];
    milestones[milestones.length - 1] = { ...last, amount: last.amount + drift };
  }
  return milestones;
}

function estimateSchedule(
  requirements: QuotationRequirements,
  config: PricingConfig,
): QuotationSchedule {
  const extraPlatforms = Math.max(requirements.platforms.length - config.platformsIncluded, 0);
  const raw =
    config.baseWeeksByService[requirements.service] +
    requirements.features.length * config.weeksPerFeature +
    requirements.integrations.length * config.weeksPerIntegration +
    extraPlatforms * config.weeksPerExtraPlatform;

  const compressed = raw * config.timelineCompression[requirements.timeline];
  const low = Math.max(2, Math.round(compressed));
  const high = Math.max(low + 2, Math.round(compressed * 1.3));

  return {
    deliveryWeeksLow: low,
    deliveryWeeksHigh: high,
    deliveryLabel: `${low}–${high} weeks from kick-off`,
  };
}

function buildScopeSummary(requirements: QuotationRequirements): string {
  const platforms = requirements.platforms.map(platformLabel).join(", ") || "to be confirmed";
  const parts = [
    `${serviceLabel(requirements.service)} engagement for ${requirements.projectName}.`,
    `Target platforms: ${platforms}.`,
    `${requirements.features.length} key feature area${requirements.features.length === 1 ? "" : "s"} and ${requirements.integrations.length} third-party integration${requirements.integrations.length === 1 ? "" : "s"}.`,
    `Design scope: ${designLabel(requirements.design)}. Expected scale: ${volumeLabel(requirements.userVolume)}.`,
    `Preferred pace: ${timelineLabel(requirements.timeline)}. Support: ${maintenanceLabel(requirements.maintenance)}.`,
  ];
  return parts.join(" ");
}

function buildAssumptions(
  requirements: QuotationRequirements,
  schedule: QuotationSchedule,
  config: PricingConfig,
): string[] {
  const assumptions = [
    "Requirements are as described in the submitted brief; material changes are handled through a written change request.",
    `Delivery of ${schedule.deliveryWeeksLow}–${schedule.deliveryWeeksHigh} weeks assumes kick-off within ${config.validityDays} days and a single nominated decision-maker for approvals.`,
    "Content, copy, product data and brand assets are supplied by the client unless separately quoted.",
    "Client feedback on each milestone is consolidated and returned within three working days.",
  ];

  if (requirements.integrations.length > 0) {
    assumptions.push(
      "Third-party services are available with documented APIs, and the client provides sandbox and production credentials.",
    );
  }
  if (requirements.platforms.includes("ios") || requirements.platforms.includes("android")) {
    assumptions.push(
      "App Store and Google Play developer accounts are registered in the client's name; store review timelines sit outside our control.",
    );
  }
  if (requirements.design === "template") {
    assumptions.push("Design work adapts an existing template rather than producing bespoke screens.");
  }
  if (requirements.maintenance === "none") {
    assumptions.push("A 30-day defect warranty applies after handover; ongoing support is not included.");
  }
  return assumptions;
}

function buildExclusions(requirements: QuotationRequirements, config: PricingConfig): string[] {
  const exclusions = [
    "Third-party licences, subscriptions and gateway commissions (billed at cost).",
    "Cloud hosting, domains, SSL certificates and SMS/email sending credits.",
    "Content writing, translation, photography and video production.",
    "Paid marketing, SEO campaigns and app store optimisation.",
    `Taxes other than ${config.taxLabel} where applicable, and any bank or remittance charges.`,
  ];
  if (!requirements.features.includes("ai")) {
    exclusions.push("Machine-learning model training, data labelling and AI infrastructure.");
  }
  if (requirements.maintenance === "none") {
    exclusions.push("Post-warranty maintenance, feature enhancements and 24/7 monitoring.");
  }
  return exclusions;
}

/**
 * Build the full quotation document from validated requirements.
 * `config` is the persisted rate card; `requirements` is customer input only.
 */
export function calculateQuotation(
  requirements: QuotationRequirements,
  config: PricingConfig,
): QuotationDocument {
  const { roundTo } = config;
  const items: QuotationLineItem[] = [];

  items.push(
    line(
      {
        id: "core",
        category: "core",
        description: `${serviceLabel(requirements.service)} — core build`,
        detail: "Architecture, foundation, core screens, data model and deployment pipeline.",
        quantity: 1,
        unitPrice: config.baseByService[requirements.service],
      },
      roundTo,
    ),
  );

  // The base price covers the primary platform; the rest are priced individually.
  const extraPlatforms = requirements.platforms.slice(config.platformsIncluded);
  for (const platform of extraPlatforms) {
    items.push(
      line(
        {
          id: `platform:${platform}`,
          category: "platform",
          description: `Platform delivery — ${platformLabel(platform)}`,
          quantity: 1,
          unitPrice: config.platformPrice[platform],
        },
        roundTo,
      ),
    );
  }

  const multiplier = complexityMultiplier(requirements.features.length, config);
  for (const feature of requirements.features) {
    items.push(
      line(
        {
          id: `feature:${feature}`,
          category: "feature",
          description: featureLabel(feature),
          detail: multiplier > 1 ? `Includes ${Math.round((multiplier - 1) * 100)}% integration-complexity uplift` : undefined,
          quantity: 1,
          unitPrice: roundMoney(config.featurePrice[feature] * multiplier, roundTo),
        },
        roundTo,
      ),
    );
  }

  for (const integration of requirements.integrations) {
    items.push(
      line(
        {
          id: `integration:${integration}`,
          category: "integration",
          description: `Integration — ${integrationLabel(integration)}`,
          quantity: 1,
          unitPrice: config.integrationPrice[integration],
        },
        roundTo,
      ),
    );
  }

  items.push(
    line(
      {
        id: "design",
        category: "design",
        description: `Design — ${designLabel(requirements.design)}`,
        quantity: 1,
        unitPrice: config.designPrice[requirements.design],
      },
      roundTo,
    ),
  );

  const scalability = config.scalabilityPrice[requirements.userVolume];
  if (scalability > 0) {
    items.push(
      line(
        {
          id: "scalability",
          category: "scalability",
          description: `Scalability & infrastructure — ${volumeLabel(requirements.userVolume)}`,
          detail: "Load testing, caching strategy, and horizontally scalable deployment.",
          quantity: 1,
          unitPrice: scalability,
        },
        roundTo,
      ),
    );
  }

  // Delivery overheads are derived from the build cost priced so far.
  const buildSubtotal = items.reduce((sum, item) => sum + item.total, 0);

  items.push(
    line(
      {
        id: "qa",
        category: "delivery",
        description: "QA, testing & deployment",
        detail: `${Math.round(config.qaPct * 100)}% of build scope`,
        quantity: 1,
        unitPrice: roundMoney(buildSubtotal * config.qaPct, roundTo),
      },
      roundTo,
    ),
    line(
      {
        id: "pm",
        category: "delivery",
        description: "Project management & client communication",
        detail: `${Math.round(config.projectManagementPct * 100)}% of build scope`,
        quantity: 1,
        unitPrice: roundMoney(buildSubtotal * config.projectManagementPct, roundTo),
      },
      roundTo,
    ),
  );

  const surchargePct = config.timelineSurchargePct[requirements.timeline];
  if (surchargePct > 0) {
    items.push(
      line(
        {
          id: "urgency",
          category: "delivery",
          description: `Accelerated delivery — ${timelineLabel(requirements.timeline)}`,
          detail: `${Math.round(surchargePct * 100)}% schedule-compression surcharge`,
          quantity: 1,
          unitPrice: roundMoney(buildSubtotal * surchargePct, roundTo),
        },
        roundTo,
      ),
    );
  }

  const maintenance = config.maintenancePrice[requirements.maintenance];
  if (maintenance > 0) {
    items.push(
      line(
        {
          id: "maintenance",
          category: "maintenance",
          description: `Support & maintenance — ${maintenanceLabel(requirements.maintenance)}`,
          quantity: 1,
          unitPrice: maintenance,
        },
        roundTo,
      ),
    );
  }

  const beforeContingency = items.reduce((sum, item) => sum + item.total, 0);
  items.push(
    line(
      {
        id: "contingency",
        category: "contingency",
        description: "Contingency allowance",
        detail: `${Math.round(config.contingencyPct * 100)}% held against scope discovery`,
        quantity: 1,
        unitPrice: roundMoney(beforeContingency * config.contingencyPct, roundTo),
      },
      roundTo,
    ),
  );

  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const tier = config.discountTiers.find((candidate) => subtotal >= candidate.minSubtotal);

  const totals = recalculateTotals(items, {
    config,
    discountPct: tier?.pct ?? 0,
    discountLabel: tier?.label ?? null,
    taxPct: config.taxPct,
    taxLabel: config.taxLabel,
    rangeSpreadPct: spreadFor(requirements, config),
  });

  const schedule = estimateSchedule(requirements, config);

  return {
    lineItems: items,
    totals,
    schedule,
    paymentSchedule: buildPaymentSchedule(totals.total, config),
    assumptions: buildAssumptions(requirements, schedule, config),
    exclusions: buildExclusions(requirements, config),
    scopeSummary: buildScopeSummary(requirements),
    validityDays: config.validityDays,
    disclaimer: APPROXIMATE_DISCLAIMER,
    pricingVersion: config.version,
  };
}
