import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  EDIT_LIMITS,
  applyEditPatch,
  diffQuotation,
  normalizeEditPatch,
} from "../src/lib/quotation/admin.ts";
import { DEFAULT_PRICING_CONFIG } from "../src/lib/quotation/pricing-config.ts";
import {
  QUOTATION_STATUS_META,
  isAwaitingAutoSend,
  needsApproval,
} from "../src/lib/quotation/status-meta.ts";
import { QUOTATION_STATUSES, toSummary } from "../src/lib/quotation/types.ts";
import { record } from "./helpers/fixtures.ts";

const config = DEFAULT_PRICING_CONFIG;
const root = process.cwd();

/* ---------------------------------------------------------- the edit model */

test("keeps an administrator's edited quantities and prices", () => {
  const base = record();
  const patch = normalizeEditPatch(
    {
      lineItems: base.document.lineItems.map((item) =>
        item.id === "core" ? { ...item, quantity: 2, unitPrice: 500_000 } : item,
      ),
      discountPct: 0.1,
      discountLabel: "Negotiated rate",
      taxPct: base.document.totals.taxPct,
      taxLabel: "VAT",
      assumptions: base.document.assumptions,
      exclusions: base.document.exclusions,
      scopeSummary: base.document.scopeSummary,
      deliveryLabel: "8-12 weeks from kick-off",
      validityDays: 45,
      adminNotes: "Client asked for a 10% partner rate.",
    },
    base,
  );

  const document = applyEditPatch(base, patch, config);
  const core = document.lineItems.find((item) => item.id === "core");

  assert.equal(core?.quantity, 2);
  assert.equal(core?.unitPrice, 500_000);
  assert.equal(core?.total, 1_000_000, "the server re-multiplies rather than trusting the client");
  assert.equal(document.totals.discountPct, 0.1);
  assert.equal(document.totals.discountLabel, "Negotiated rate");
  assert.equal(document.schedule.deliveryLabel, "8-12 weeks from kick-off");
  assert.equal(document.validityDays, 45);
});

test("never accepts a client-supplied total, status, number or deadline", () => {
  const base = record();
  const patch = normalizeEditPatch(
    {
      lineItems: [
        {
          id: "core",
          category: "core",
          description: "Core build",
          quantity: 1,
          unitPrice: 100_000,
          // A hostile client trying to dictate the arithmetic:
          total: 1,
        },
      ],
      discountPct: 0,
      taxPct: 0,
      // …and the workflow:
      status: "sent",
      number: "VZQ-1999-9999",
      reviewDeadline: "1999-01-01T00:00:00.000Z",
      revision: 999,
      totals: { total: 1, rangeLow: 1, rangeHigh: 1 },
    },
    base,
  );

  assert.equal("status" in patch, false);
  assert.equal("number" in patch, false);
  assert.equal("reviewDeadline" in patch, false);
  assert.equal("revision" in patch, false);
  assert.equal("totals" in patch, false);

  const document = applyEditPatch(base, patch, config);
  assert.equal(document.lineItems[0].total, 100_000, "the injected line total is ignored");
  assert.equal(document.totals.subtotal, 100_000);
  assert.equal(document.totals.rangeLow < document.totals.total, true);
});

test("clamps hostile numbers and text lengths", () => {
  const base = record();
  const patch = normalizeEditPatch(
    {
      lineItems: [
        {
          id: "x",
          category: "not-a-category",
          description: "d".repeat(1_000),
          detail: "e".repeat(1_000),
          quantity: -50,
          unitPrice: Number.MAX_SAFE_INTEGER,
        },
      ],
      discountPct: 9_999,
      taxPct: -1,
      validityDays: 100_000,
      adminNotes: "n".repeat(50_000),
    },
    base,
  );

  const item = patch.lineItems[0];
  assert.equal(item.description.length, EDIT_LIMITS.description);
  assert.equal(item.detail?.length, EDIT_LIMITS.detail);
  assert.equal(item.quantity, 1, "a negative quantity floors at one");
  assert.equal(item.unitPrice, EDIT_LIMITS.maxUnitPrice);
  assert.equal(item.category, "feature", "an unknown category falls back rather than persisting");
  assert.equal(patch.discountPct, 1, "percentages clamp to 100%");
  assert.equal(patch.taxPct, 0);
  assert.equal(patch.validityDays, 365);
  assert.equal(patch.adminNotes.length, EDIT_LIMITS.adminNotes);
});

test("strips angle brackets from every edited string", () => {
  const base = record();
  const patch = normalizeEditPatch(
    {
      lineItems: [
        { id: "x", category: "core", description: "<img onerror=alert(1)>", quantity: 1, unitPrice: 1 },
      ],
      scopeSummary: "<script>bad()</script>",
      adminNotes: "<b>notes</b>",
      assumptions: ["<i>assumption</i>"],
    },
    base,
  );

  assert.equal(patch.lineItems[0].description.includes("<"), false);
  assert.equal(patch.scopeSummary.includes("<"), false);
  assert.equal(patch.adminNotes.includes("<"), false);
  assert.equal(patch.assumptions[0].includes("<"), false);
});

test("an empty edit falls back to the existing document rather than blanking it", () => {
  const base = record();
  const patch = normalizeEditPatch({ lineItems: [], assumptions: [], exclusions: [] }, base);

  assert.deepEqual(patch.lineItems, base.document.lineItems);
  assert.deepEqual(patch.assumptions, base.document.assumptions);
  assert.deepEqual(patch.exclusions, base.document.exclusions);
});

test("caps the number of line items and list entries", () => {
  const base = record();
  const many = Array.from({ length: 200 }, (_, index) => ({
    id: `x${index}`,
    category: "feature",
    description: `Item ${index}`,
    quantity: 1,
    unitPrice: 1_000,
  }));
  const patch = normalizeEditPatch(
    { lineItems: many, assumptions: Array.from({ length: 200 }, (_, i) => `A${i}`) },
    base,
  );

  assert.equal(patch.lineItems.length, EDIT_LIMITS.maxLineItems);
  assert.equal(patch.assumptions.length, EDIT_LIMITS.maxListEntries);
});

/* ------------------------------------------------------- revision history */

test("describes exactly what an edit changed", () => {
  const base = record();
  const patch = normalizeEditPatch(
    {
      lineItems: [
        ...base.document.lineItems
          .filter((item) => item.id !== "design")
          .map((item) =>
            item.id === "core" ? { ...item, unitPrice: item.unitPrice + 100_000 } : item,
          ),
        { id: "custom:1", category: "feature", description: "Data migration", quantity: 1, unitPrice: 75_000 },
      ],
      discountPct: 0.12,
      discountLabel: "Partner rate",
      taxPct: base.document.totals.taxPct,
      taxLabel: base.document.totals.taxLabel,
      assumptions: base.document.assumptions,
      exclusions: base.document.exclusions,
      scopeSummary: base.document.scopeSummary,
      deliveryLabel: base.document.schedule.deliveryLabel,
      validityDays: base.document.validityDays,
      adminNotes: "Internal: approved by finance.",
    },
    base,
  );

  const document = applyEditPatch(base, patch, config);
  const changes = diffQuotation(base, document, patch.adminNotes);

  assert.ok(changes.some((change) => /unit price/i.test(change)), "price change recorded");
  assert.ok(changes.some((change) => /^Added "Data migration"/.test(change)), "addition recorded");
  assert.ok(changes.some((change) => /^Removed /.test(change)), "removal recorded");
  assert.ok(
    changes.some((change) => /^Discount \d+% to 12%$/.test(change)),
    "discount change recorded",
  );
  assert.ok(changes.some((change) => /^Total /.test(change)), "total change recorded");
  assert.ok(changes.some((change) => /internal notes/i.test(change)), "notes change recorded");
});

test("an unchanged edit produces no changes, so no revision is recorded", () => {
  const base = record();
  const patch = normalizeEditPatch(
    {
      lineItems: base.document.lineItems,
      discountPct: base.document.totals.discountPct,
      discountLabel: base.document.totals.discountLabel ?? "Discount",
      taxPct: base.document.totals.taxPct,
      taxLabel: base.document.totals.taxLabel,
      assumptions: base.document.assumptions,
      exclusions: base.document.exclusions,
      scopeSummary: base.document.scopeSummary,
      deliveryLabel: base.document.schedule.deliveryLabel,
      validityDays: base.document.validityDays,
      adminNotes: base.adminNotes,
    },
    base,
  );

  const document = applyEditPatch(base, patch, config);
  assert.deepEqual(diffQuotation(base, document, patch.adminNotes), []);
});

test("payment milestones are rebuilt to match an edited total", () => {
  const base = record();
  const patch = normalizeEditPatch(
    {
      lineItems: [
        { id: "core", category: "core", description: "Core build", quantity: 1, unitPrice: 2_000_000 },
      ],
      discountPct: 0,
      taxPct: 0,
    },
    base,
  );

  const document = applyEditPatch(base, patch, config);
  const sum = document.paymentSchedule.reduce((total, milestone) => total + milestone.amount, 0);
  assert.equal(sum, document.totals.total);
});

/* --------------------------------------------------------- authorization */

test("every admin quotation action checks the session before acting", () => {
  const source = readFileSync(join(root, "src/lib/quotation/actions.ts"), "utf8");

  assert.match(source, /async function requireAdmin\(\)/);
  assert.match(source, /const user = await getSession\(\);\s*if \(!user\) throw new Error\("Unauthorized"\);/);

  const exported = [...source.matchAll(/export async function (\w+)\s*\(/g)].map((match) => match[1]);
  assert.ok(exported.length >= 7, "expected the full set of admin actions");

  for (const name of exported) {
    const start = source.indexOf(`export async function ${name}`);
    const next = exported
      .map((other) => source.indexOf(`export async function ${other}`))
      .filter((index) => index > start)
      .sort((a, b) => a - b)[0];
    const body = source.slice(start, next === undefined ? source.length : next);
    assert.match(body, /await requireAdmin\(\)/, `${name} must call requireAdmin()`);
  }
});

test("the PDF route refuses unauthenticated requests", () => {
  const source = readFileSync(join(root, "src/app/api/quotations/[id]/pdf/route.ts"), "utf8");
  assert.match(source, /const user = await getSession\(\)/);
  assert.match(source, /if \(!user\) return NextResponse\.json\([^)]*401/s);
});

/** Source below the import block, so call order is compared, not import order. */
function bodyOf(file: string): string {
  const source = readFileSync(join(root, file), "utf8");
  const lastImport = source.lastIndexOf("\nimport ");
  return source.slice(source.indexOf("\n", lastImport + 1));
}

test("the job callback verifies its signature before reading the payload", () => {
  const body = bodyOf("src/app/api/quotations/dispatch/route.ts");
  const verifyAt = body.indexOf("await verifyDispatchWebhook(");
  const parseAt = body.indexOf("parseDispatchPayload(");
  assert.ok(verifyAt > -1 && parseAt > -1);
  assert.ok(verifyAt < parseAt, "verification must happen before the payload is used");
});

test("the cron route authorizes before sweeping", () => {
  const body = bodyOf("src/app/api/quotations/cron/route.ts");
  const authAt = body.indexOf("verifyCronRequest(");
  const sweepAt = body.indexOf("dispatchDueQuotations(");
  assert.ok(authAt > -1 && sweepAt > -1);
  assert.ok(authAt < sweepAt);
});

test("pricing rules are never imported into a client component", () => {
  const clientFiles = [
    "src/app/quotation/EstimateForm.tsx",
    "src/app/admin/(panel)/quotations/QuotationsClient.tsx",
    "src/app/admin/(panel)/quotations/[id]/QuotationDetail.tsx",
  ];
  for (const file of clientFiles) {
    const source = readFileSync(join(root, file), "utf8");
    assert.equal(
      source.includes("quotation/pricing-config"),
      false,
      `${file} must not bundle the rate card`,
    );
    assert.equal(source.includes("quotation/pricing"), false, `${file} must not bundle the engine`);
  }
});

/* ------------------------------------------------------ status presentation */

test("every status has presentation metadata", () => {
  for (const status of QUOTATION_STATUSES) {
    const meta = QUOTATION_STATUS_META[status];
    assert.ok(meta, `missing metadata for ${status}`);
    assert.ok(meta.label.length > 0);
    assert.ok(meta.description.length > 0);
  }
});

test("only pre-send statuses show a countdown", () => {
  assert.equal(isAwaitingAutoSend("pending_review", true), true);
  assert.equal(isAwaitingAutoSend("updated", true), true);
  assert.equal(isAwaitingAutoSend("approved", true), true);
  for (const status of ["held", "cancelled", "sending", "sent", "failed"] as const) {
    assert.equal(isAwaitingAutoSend(status, true), false, status);
  }
});

test("a withheld quotation shows an approval prompt rather than a countdown", () => {
  assert.equal(isAwaitingAutoSend("pending_review", false), false);
  assert.equal(needsApproval("pending_review", false), true);
  assert.equal(needsApproval("updated", false), true);
  // Approving releases it, so the timer comes back.
  assert.equal(needsApproval("approved", true), false);
  // A hold or a cancel is its own decision, not an outstanding approval.
  for (const status of ["held", "cancelled", "sent", "failed"] as const) {
    assert.equal(needsApproval(status, false), false, status);
  }
});

test("the list projection exposes the customer summary and the amount range", () => {
  const summary = toSummary(record());
  assert.equal(summary.number, "VZQ-2026-0001");
  assert.equal(summary.contactName, "Sahan Perera");
  assert.equal(summary.projectName, "Ceylon Retail POS");
  assert.ok(summary.rangeHigh > summary.rangeLow);
  assert.equal(summary.emailState, "not_sent");
});
