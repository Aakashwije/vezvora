import test from "node:test";
import assert from "node:assert/strict";
import {
  APPROXIMATE_DISCLAIMER,
  buildPaymentSchedule,
  calculateQuotation,
  formatRange,
  recalculateTotals,
  roundMoney,
} from "../src/lib/quotation/pricing.ts";
import {
  DEFAULT_PRICING_CONFIG,
  normalizePricingConfig,
} from "../src/lib/quotation/pricing-config.ts";
import { requirements } from "./helpers/fixtures.ts";

const config = DEFAULT_PRICING_CONFIG;

test("prices a quotation deterministically", () => {
  const first = calculateQuotation(requirements(), config);
  const second = calculateQuotation(requirements(), config);
  assert.deepEqual(first, second);
});

test("itemises every platform, feature and integration selected", () => {
  const input = requirements({
    platforms: ["web", "ios", "android"],
    features: ["auth", "payments", "reporting"],
    integrations: ["sms", "payment_gateway"],
  });
  const document = calculateQuotation(input, config);
  const ids = document.lineItems.map((item) => item.id);

  assert.ok(ids.includes("core"));
  // The first platform is covered by the base price.
  assert.equal(ids.includes("platform:web"), false);
  assert.ok(ids.includes("platform:ios"));
  assert.ok(ids.includes("platform:android"));
  for (const feature of input.features) assert.ok(ids.includes(`feature:${feature}`));
  for (const integration of input.integrations) {
    assert.ok(ids.includes(`integration:${integration}`));
  }
  assert.ok(ids.includes("design"));
  assert.ok(ids.includes("qa"));
  assert.ok(ids.includes("pm"));
  assert.ok(ids.includes("contingency"));
});

test("every line total is quantity times unit price, and the subtotal is their sum", () => {
  const document = calculateQuotation(requirements(), config);
  let sum = 0;
  for (const item of document.lineItems) {
    assert.equal(item.total, roundMoney(item.quantity * item.unitPrice, config.roundTo));
    sum += item.total;
  }
  assert.equal(document.totals.subtotal, sum);
});

test("applies discount, then tax, then produces the total", () => {
  const document = calculateQuotation(requirements(), config);
  const { subtotal, discountAmount, taxAmount, total } = document.totals;
  const net = subtotal - discountAmount;
  assert.equal(taxAmount, roundMoney(net * document.totals.taxPct, config.roundTo));
  assert.equal(total, roundMoney(net + taxAmount, config.roundTo));
});

test("produces a price range around the total rather than a single fixed price", () => {
  const document = calculateQuotation(requirements(), config);
  const { rangeLow, rangeHigh, total, rangeSpreadPct } = document.totals;

  assert.ok(rangeLow < total, "low bound must sit below the total");
  assert.ok(rangeHigh > total, "high bound must sit above the total");
  assert.equal(rangeLow, roundMoney(total * (1 - rangeSpreadPct), config.roundTo));
  assert.equal(rangeHigh, roundMoney(total * (1 + rangeSpreadPct), config.roundTo));
});

test("widens the range when the brief is thin", () => {
  const detailed = calculateQuotation(requirements(), config);
  const sparse = calculateQuotation(
    requirements({ description: "Need an app for my shop soon.", features: ["auth"] }),
    config,
  );

  assert.equal(detailed.totals.rangeSpreadPct, config.rangeSpreadPct);
  assert.equal(sparse.totals.rangeSpreadPct, config.lowConfidenceSpreadPct);
  assert.ok(sparse.totals.rangeSpreadPct > detailed.totals.rangeSpreadPct);
});

test("charges an urgency surcharge only for compressed timelines", () => {
  const relaxed = calculateQuotation(requirements({ timeline: "standard" }), config);
  const urgent = calculateQuotation(requirements({ timeline: "urgent" }), config);

  assert.equal(relaxed.lineItems.some((item) => item.id === "urgency"), false);
  assert.ok(urgent.lineItems.some((item) => item.id === "urgency"));
  assert.ok(urgent.totals.total > relaxed.totals.total);
  // And it delivers sooner.
  assert.ok(urgent.schedule.deliveryWeeksLow < relaxed.schedule.deliveryWeeksLow);
});

test("applies a complexity uplift once a build carries many features", () => {
  const small = calculateQuotation(requirements({ features: ["auth", "search"] }), config);
  const large = calculateQuotation(
    requirements({
      features: [
        "auth",
        "roles",
        "payments",
        "admin_dashboard",
        "realtime",
        "notifications",
        "search",
        "reporting",
        "multi_language",
        "multi_tenant",
      ],
    }),
    config,
  );

  const smallAuth = small.lineItems.find((item) => item.id === "feature:auth");
  const largeAuth = large.lineItems.find((item) => item.id === "feature:auth");
  assert.ok(smallAuth && largeAuth);
  assert.ok(largeAuth.unitPrice > smallAuth.unitPrice, "the same feature costs more in a bigger build");
});

test("selects the highest discount tier the subtotal qualifies for", () => {
  const cheap = calculateQuotation(
    requirements({ service: "website", features: ["auth"], integrations: [], platforms: ["web"] }),
    config,
  );
  assert.equal(cheap.totals.discountAmount, 0);
  assert.equal(cheap.totals.discountLabel, null);

  const large = calculateQuotation(
    requirements({
      service: "saas_platform",
      platforms: ["web", "ios", "android", "desktop"],
      features: [
        "auth",
        "roles",
        "payments",
        "admin_dashboard",
        "realtime",
        "notifications",
        "search",
        "reporting",
        "multi_tenant",
        "ai",
      ],
      integrations: ["payment_gateway", "erp_crm", "accounting", "sms"],
      userVolume: "xlarge",
      design: "brand",
    }),
    config,
  );
  assert.ok(large.totals.subtotal >= config.discountTiers[0].minSubtotal);
  assert.equal(large.totals.discountPct, config.discountTiers[0].pct);
  assert.equal(large.totals.discountLabel, config.discountTiers[0].label);
});

test("respects an administrator's updated rate card", () => {
  const doubled = normalizePricingConfig({
    ...config,
    baseByService: { ...config.baseByService, pos_system: config.baseByService.pos_system * 2 },
  });

  const before = calculateQuotation(requirements(), config);
  const after = calculateQuotation(requirements(), doubled);
  const beforeCore = before.lineItems.find((item) => item.id === "core");
  const afterCore = after.lineItems.find((item) => item.id === "core");

  assert.ok(beforeCore && afterCore);
  assert.equal(afterCore.unitPrice, beforeCore.unitPrice * 2);
  assert.ok(after.totals.total > before.totals.total);
});

test("normalization repairs a malformed stored rate card", () => {
  const repaired = normalizePricingConfig({
    baseByService: { website: "not a number", pos_system: -5, saas_platform: 2_000_000 },
    taxPct: 42,
    roundTo: 0,
    discountTiers: "nonsense",
    paymentSchedule: [],
  });

  assert.equal(repaired.baseByService.website, config.baseByService.website);
  assert.equal(repaired.baseByService.pos_system, config.baseByService.pos_system);
  assert.equal(repaired.baseByService.saas_platform, 2_000_000);
  assert.equal(repaired.taxPct, config.taxPct, "an out-of-range tax falls back to the default");
  assert.equal(repaired.roundTo, config.roundTo);
  assert.deepEqual(repaired.discountTiers, config.discountTiers);
  assert.deepEqual(repaired.paymentSchedule, config.paymentSchedule);
});

test("payment milestones sum exactly to the total", () => {
  const document = calculateQuotation(requirements(), config);
  const sum = document.paymentSchedule.reduce((total, milestone) => total + milestone.amount, 0);
  assert.equal(sum, document.totals.total);

  const odd = buildPaymentSchedule(1_234_567, config);
  assert.equal(
    odd.reduce((total, milestone) => total + milestone.amount, 0),
    1_234_567,
  );
});

test("recalculates totals from edited line items without re-running the engine", () => {
  const document = calculateQuotation(requirements(), config);
  const edited = document.lineItems.map((item) =>
    item.id === "core" ? { ...item, unitPrice: 1_000_000, total: 1_000_000 } : item,
  );

  const totals = recalculateTotals(edited, {
    config,
    discountPct: 0.1,
    discountLabel: "Negotiated",
    taxPct: 0,
    taxLabel: "VAT",
    rangeSpreadPct: 0.1,
  });

  const expectedSubtotal = edited.reduce((sum, item) => sum + item.total, 0);
  assert.equal(totals.subtotal, expectedSubtotal);
  assert.equal(totals.discountAmount, roundMoney(expectedSubtotal * 0.1, config.roundTo));
  assert.equal(totals.taxAmount, 0);
  assert.equal(totals.discountLabel, "Negotiated");
});

test("never returns a total below the configured minimum", () => {
  const totals = recalculateTotals(
    [{ id: "x", category: "core", description: "Tiny", quantity: 1, unitPrice: 1, total: 1 }],
    {
      config,
      discountPct: 0,
      discountLabel: null,
      taxPct: 0,
      taxLabel: "VAT",
      rangeSpreadPct: 0.1,
    },
  );
  assert.equal(totals.total, config.minimumTotal);
});

test("includes the approximate-quotation disclaimer, assumptions and exclusions", () => {
  const document = calculateQuotation(requirements(), config);
  assert.equal(document.disclaimer, APPROXIMATE_DISCLAIMER);
  assert.match(document.disclaimer, /approximate quotation based on the information provided/i);
  assert.ok(document.assumptions.length >= 4);
  assert.ok(document.exclusions.length >= 4);
  assert.equal(document.validityDays, config.validityDays);
});

test("estimates a delivery window with a high bound above the low bound", () => {
  const document = calculateQuotation(requirements(), config);
  assert.ok(document.schedule.deliveryWeeksLow >= 2);
  assert.ok(document.schedule.deliveryWeeksHigh > document.schedule.deliveryWeeksLow);
  assert.match(document.schedule.deliveryLabel, /weeks from kick-off/);
});

test("formats a range as two currency values", () => {
  const formatted = formatRange(100_000, 150_000, "LKR");
  assert.match(formatted, /100,000/);
  assert.match(formatted, /150,000/);
});
