/**
 * The automatic-send rule.
 *
 * Emailing every estimate at the deadline is only safe for ordinary work, so
 * these tests pin down which quotations go out unattended and which wait for an
 * administrator — and prove that the worker and the store both honour it.
 */

import test from "node:test";
import assert from "node:assert/strict";
import {
  assessConfidence,
  normalizeConfidence,
  UNASSESSED,
} from "../src/lib/quotation/confidence.ts";
import { canDispatch } from "../src/lib/quotation/dispatch.ts";
import {
  DEFAULT_PRICING_CONFIG,
  normalizePricingConfig,
  type AutoSendRules,
} from "../src/lib/quotation/pricing-config.ts";
import { calculateQuotation } from "../src/lib/quotation/pricing.ts";
import { createMemoryQuotationStore } from "../src/lib/quotation/store.ts";
import {
  isQueuedForAutoSend,
  mayAutoSend,
  type QuotationRequirements,
} from "../src/lib/quotation/types.ts";
import { createInput, record, requirements } from "./helpers/fixtures.ts";

const RULES = DEFAULT_PRICING_CONFIG.autoSend;

/** An ordinary brochure site: well described, modest scope, comfortably priced. */
function ordinary(overrides: Partial<QuotationRequirements> = {}): QuotationRequirements {
  return requirements({
    service: "website",
    projectName: "Kandy Tea Estate site",
    description:
      "A marketing website for a tea estate with eight content pages, a photo gallery of the estate and factory, an enquiry form that emails the sales team, and a simple blog the marketing coordinator can update. Content and photography are already prepared and will be supplied at kick-off.",
    platforms: ["web"],
    features: ["auth", "search", "documents"],
    integrations: ["analytics"],
    design: "standard",
    userVolume: "small",
    timeline: "standard",
    maintenance: "basic",
    budget: "1m_2_5m",
    ...overrides,
  });
}

function assess(input: QuotationRequirements, rules: AutoSendRules = RULES) {
  const document = calculateQuotation(input, DEFAULT_PRICING_CONFIG);
  return assessConfidence(input, document, rules);
}

function codes(input: QuotationRequirements, rules: AutoSendRules = RULES): string[] {
  return assess(input, rules).flags.map((flag) => flag.code);
}

/* ------------------------------------------------------------ the rule */

test("an ordinary, well-specified, modestly priced estimate sends automatically", () => {
  const verdict = assess(ordinary());
  assert.equal(verdict.autoSend, true);
  assert.equal(verdict.level, "high");
  assert.equal(verdict.score, 100);
  assert.deepEqual(verdict.flags, []);
  assert.equal(verdict.reviewReason, null);
});

test("an expensive estimate always waits, however well specified it is", () => {
  // The default fixture is a six-branch POS platform: a thorough brief, but far
  // above the value ceiling. Clarity does not buy it an unattended send.
  const verdict = assess(requirements());
  assert.equal(verdict.autoSend, false);
  assert.ok(verdict.score >= 80, "the brief itself is a good one");
  assert.ok(codes(requirements()).includes("high_value"));
  assert.match(verdict.reviewReason ?? "", /value ceiling/i);
});

test("bespoke service categories always wait", () => {
  for (const service of ["custom_system", "other"] as const) {
    const verdict = assess(ordinary({ service }));
    assert.equal(verdict.autoSend, false, service);
    assert.ok(codes(ordinary({ service })).includes("bespoke_service"), service);
  }
});

test("a thin brief alone is enough to withhold the estimate", () => {
  // The engine already widens the band for a short description; a number it
  // cannot price precisely must not be emailed unattended.
  const thin = ordinary({
    description: "We need a website for our tea estate as soon as possible please.",
  });
  const verdict = assess(thin);
  assert.deepEqual(codes(thin), ["thin_brief"]);
  assert.ok(verdict.score < RULES.minScore);
  assert.equal(verdict.autoSend, false);
});

test("soft signals accumulate until the estimate is withheld", () => {
  // Urgency alone is a 10-point deduction: noted, but not enough to withhold.
  const urgent = ordinary({ timeline: "urgent" });
  assert.deepEqual(codes(urgent), ["urgent_timeline"]);
  assert.equal(assess(urgent).score, 90);
  assert.equal(assess(urgent).autoSend, true);

  // A second signal lands exactly on the threshold, which is inclusive.
  const alsoUnscoped = ordinary({ timeline: "urgent", features: ["auth"] });
  assert.deepEqual(codes(alsoUnscoped).sort(), ["unscoped", "urgent_timeline"]);
  assert.equal(assess(alsoUnscoped).score, RULES.minScore);
  assert.equal(assess(alsoUnscoped).autoSend, true);

  // A third crosses it, and the estimate waits for a human.
  const alsoBudget = ordinary({
    timeline: "urgent",
    features: ["auth"],
    budget: "under_500k",
  });
  assert.equal(assess(alsoBudget).autoSend, false);
  assert.equal(assess(alsoBudget).level, "low");
});

test("an estimate above the customer's stated budget is flagged for a human", () => {
  const tightBudget = ordinary({ budget: "under_500k" });
  assert.ok(codes(tightBudget).includes("budget_gap"));

  // An undisclosed budget carries no signal either way.
  assert.ok(!codes(ordinary({ budget: "undisclosed" })).includes("budget_gap"));
  assert.ok(!codes(ordinary({ budget: "over_5m" })).includes("budget_gap"));
});

test("unusually broad scope is flagged", () => {
  const broad = ordinary({
    platforms: ["web", "ios", "android", "desktop"],
    integrations: [
      "payment_gateway",
      "sms",
      "whatsapp",
      "email_marketing",
      "accounting",
      "erp_crm",
      "logistics",
    ],
  });
  const flags = codes(broad);
  assert.ok(flags.includes("many_platforms"));
  assert.ok(flags.includes("many_integrations"));
});

test("the master switch holds every estimate, including flawless ones", () => {
  const verdict = assess(ordinary(), { ...RULES, enabled: false });
  assert.equal(verdict.autoSend, false);
  assert.equal(verdict.score, 100, "the estimate is still a confident one");
  assert.ok(codes(ordinary(), { ...RULES, enabled: false }).includes("rules_disabled"));
});

test("confidence level describes the estimate, not the sending policy", () => {
  // A large, clearly described project: high confidence in the numbers, and
  // withheld anyway because of its size. The two verdicts are independent.
  const verdict = assess(requirements());
  assert.equal(verdict.level, "high");
  assert.equal(verdict.autoSend, false);
});

test("the reason names a blocking rule rather than a soft signal", () => {
  // This brief trips two blocking rules and two soft ones. The summary an
  // administrator reads must be one of the reasons that actually withheld it.
  const verdict = assess(
    ordinary({ service: "custom_system", description: "Short brief.", features: [] }),
  );
  const blocking = verdict.flags.filter((entry) => entry.blocking);
  assert.ok(blocking.length >= 2, "expected both a value and a category block");
  assert.equal(verdict.reviewReason, blocking[0].label);
});

test("without a blocking rule the reason summarises the soft signals", () => {
  const verdict = assess(
    ordinary({
      timeline: "urgent",
      features: ["auth"],
      description: "We need a small site.",
    }),
  );
  assert.ok(verdict.flags.every((entry) => !entry.blocking));
  assert.match(verdict.reviewReason ?? "", /and 2 other signals/);
});

/* --------------------------------------------------- stored assessments */

test("a missing or malformed assessment withholds the estimate", () => {
  for (const junk of [undefined, null, "yes", 42, [], {}]) {
    const restored = normalizeConfidence(junk);
    assert.equal(restored.autoSend, false, JSON.stringify(junk));
  }
  assert.deepEqual(normalizeConfidence(undefined), UNASSESSED);
});

test("only an explicit true releases a stored assessment", () => {
  assert.equal(normalizeConfidence({ autoSend: "true" }).autoSend, false);
  assert.equal(normalizeConfidence({ autoSend: 1 }).autoSend, false);
  assert.equal(normalizeConfidence({ autoSend: true }).autoSend, true);
});

test("stored assessments keep only recognised flags", () => {
  const restored = normalizeConfidence({
    autoSend: false,
    score: 55,
    flags: [{ code: "thin_brief", blocking: false }, { code: "made_up" }, null, "nonsense"],
  });
  assert.deepEqual(
    restored.flags.map((flag) => flag.code),
    ["thin_brief"],
  );
  // The label is re-derived rather than trusted, so stored text cannot be spoofed.
  assert.match(restored.flags[0].label, /description is too short/i);
});

test("an out-of-range stored score is clamped", () => {
  assert.equal(normalizeConfidence({ score: 5_000 }).score, 100);
  assert.equal(normalizeConfidence({ score: -20 }).score, 0);
  assert.equal(normalizeConfidence({ score: Number.NaN }).score, 0);
});

/* ------------------------------------------------------ configured rules */

test("a corrupt rules blob falls back to the shipped defaults", () => {
  const repaired = normalizePricingConfig({ autoSend: "not an object" });
  assert.deepEqual(repaired.autoSend, DEFAULT_PRICING_CONFIG.autoSend);
});

test("rules are clamped and unknown hold categories dropped", () => {
  const repaired = normalizePricingConfig({
    autoSend: {
      minScore: 900,
      maxTotal: -1,
      holdServices: ["website", "website", "not_a_service"],
      minFeatures: -4,
    },
  });
  assert.equal(repaired.autoSend.minScore, 100);
  assert.equal(repaired.autoSend.maxTotal, DEFAULT_PRICING_CONFIG.autoSend.maxTotal);
  assert.deepEqual(repaired.autoSend.holdServices, ["website"]);
  assert.equal(repaired.autoSend.minFeatures, 0);
});

test("automatic sending is only switched off by an explicit false", () => {
  assert.equal(normalizePricingConfig({ autoSend: { enabled: false } }).autoSend.enabled, false);
  // A corrupt or absent value must not silently disable the workflow.
  assert.equal(normalizePricingConfig({ autoSend: { enabled: "no" } }).autoSend.enabled, true);
  assert.equal(normalizePricingConfig({ autoSend: {} }).autoSend.enabled, true);
});

/* ----------------------------------------------------------- enforcement */

test("approving is the override that releases a withheld quotation", () => {
  const withheld = record({ confidence: normalizeConfidence({ autoSend: false }) });
  assert.equal(mayAutoSend(withheld), false);
  assert.equal(mayAutoSend({ ...withheld, status: "approved" }), true);
});

test("the worker refuses to auto-send a withheld quotation at the deadline", () => {
  const now = new Date("2026-08-29T09:10:01.000Z").getTime();
  const withheld = record({ confidence: normalizeConfidence({ autoSend: false }) });

  const auto = canDispatch(withheld, "auto", now);
  assert.deepEqual(auto, { ok: false, reason: "requires_approval" });

  // Approving releases it; an administrator sending by hand always may.
  assert.deepEqual(canDispatch({ ...withheld, status: "approved" }, "auto", now), { ok: true });
  assert.deepEqual(canDispatch(withheld, "manual", now), { ok: true });
});

test("a hold or a cancel still outranks the confidence verdict", () => {
  const now = new Date("2026-08-29T09:10:01.000Z").getTime();
  for (const status of ["held", "cancelled"] as const) {
    const cleared = record({ status });
    assert.deepEqual(canDispatch(cleared, "auto", now), { ok: false, reason: "not_sendable" });
  }
});

test("the approval check is reported ahead of the deadline check", () => {
  // Before the deadline both apply; the useful answer is the one a human acts on.
  const before = new Date("2026-08-29T09:05:00.000Z").getTime();
  const withheld = record({ confidence: normalizeConfidence({ autoSend: false }) });
  assert.deepEqual(canDispatch(withheld, "auto", before), {
    ok: false,
    reason: "requires_approval",
  });
});

test("a withheld quotation never enters the worker's queue", async () => {
  const store = createMemoryQuotationStore();
  const afterDeadline = new Date("2026-08-29T09:10:01.000Z").getTime();

  const withheld = await store.create(
    createInput({ confidence: normalizeConfidence({ autoSend: false }) }),
  );
  assert.equal(isQueuedForAutoSend(withheld), false);
  assert.deepEqual(await store.dueForDispatch(afterDeadline), []);

  // Approving puts it back in the queue without any other change.
  await store.update(withheld.id, (current) => ({ ...current, status: "approved" }));
  const due = await store.dueForDispatch(afterDeadline);
  assert.deepEqual(
    due.map((entry) => entry.id),
    [withheld.id],
  );
});

test("a cleared quotation queues as before", async () => {
  const store = createMemoryQuotationStore();
  const created = await store.create(createInput());
  assert.equal(isQueuedForAutoSend(created), true);
  const due = await store.dueForDispatch(new Date("2026-08-29T09:10:01.000Z").getTime());
  assert.deepEqual(
    due.map((entry) => entry.id),
    [created.id],
  );
});
