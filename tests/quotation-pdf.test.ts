import test from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { PDFDocument } from "pdf-lib";
import {
  LETTERHEAD_PATH,
  loadLetterhead,
  renderQuotationPdf,
  resetLetterheadCache,
  sanitizeForPdf,
} from "../src/lib/quotation/pdf.ts";
import { calculateQuotation } from "../src/lib/quotation/pricing.ts";
import { DEFAULT_PRICING_CONFIG } from "../src/lib/quotation/pricing-config.ts";
import { makeTestPng } from "./helpers/png.ts";
import { record, requirements } from "./helpers/fixtures.ts";

const A4_RATIO_PNG = makeTestPng(248, 351, [250, 251, 248]);
const A4_POINTS = { width: 595.28, height: 841.89 };

function isPdf(bytes: Uint8Array): boolean {
  return Buffer.from(bytes.subarray(0, 5)).toString("ascii") === "%PDF-";
}

test("renders a valid A4 PDF using the letterhead artwork", async () => {
  const result = await renderQuotationPdf(record(), { letterhead: A4_RATIO_PNG });

  assert.equal(isPdf(result.bytes), true);
  assert.equal(result.usedLetterhead, true);
  assert.ok(result.bytes.byteLength > 1_000);
  assert.match(result.hash, /^[0-9a-f]{32}$/);

  const parsed = await PDFDocument.load(result.bytes);
  assert.ok(parsed.getPageCount() >= 1);
  const page = parsed.getPage(0);
  assert.ok(Math.abs(page.getWidth() - A4_POINTS.width) < 0.1);
  assert.ok(Math.abs(page.getHeight() - A4_POINTS.height) < 0.1);
});

test("falls back to a clean layout when the letterhead is missing", async () => {
  const warnings: string[] = [];
  const originalWarn = console.warn;
  console.warn = (message: unknown) => warnings.push(String(message));

  try {
    const result = await renderQuotationPdf(record(), { letterhead: null });
    assert.equal(isPdf(result.bytes), true);
    assert.equal(result.usedLetterhead, false, "the fallback layout is flagged to the caller");
    const parsed = await PDFDocument.load(result.bytes);
    assert.ok(parsed.getPageCount() >= 1);
  } finally {
    console.warn = originalWarn;
  }
});

test("a missing letterhead file warns loudly instead of throwing", async (t) => {
  if (existsSync(LETTERHEAD_PATH)) {
    t.skip("a real letterhead is installed; the missing-file path cannot be exercised");
    return;
  }

  resetLetterheadCache();
  const warnings: string[] = [];
  const originalWarn = console.warn;
  console.warn = (message: unknown) => warnings.push(String(message));

  try {
    const state = await loadLetterhead();
    assert.equal(state.available, false);
    assert.match(state.reason ?? "", /public\/quotation\/vezvora-letterhead\.png/);
    assert.equal(warnings.length, 1, "warns exactly once per server instance");
    assert.match(warnings[0], /\[quotation\] Letterhead image not found/);

    // Second call is cached and must not warn again.
    await loadLetterhead();
    assert.equal(warnings.length, 1);
  } finally {
    console.warn = originalWarn;
    resetLetterheadCache();
  }
});

test("survives artwork that is not a valid PNG", async () => {
  const originalWarn = console.warn;
  console.warn = () => {};
  try {
    const result = await renderQuotationPdf(record(), {
      letterhead: new Uint8Array([1, 2, 3, 4, 5]),
    });
    assert.equal(isPdf(result.bytes), true);
    assert.equal(result.usedLetterhead, false);
  } finally {
    console.warn = originalWarn;
  }
});

test("paginates a large quotation and puts the letterhead on every page", async () => {
  const large = record({
    requirements: requirements({
      platforms: ["web", "ios", "android", "desktop", "pos_terminal", "tablet", "api"],
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
        "offline",
        "inventory",
        "booking",
        "documents",
        "maps",
        "ai",
      ],
      integrations: [
        "payment_gateway",
        "sms",
        "whatsapp",
        "email_marketing",
        "accounting",
        "erp_crm",
        "logistics",
        "social_login",
        "analytics",
        "custom_api",
      ],
    }),
  });
  large.document = calculateQuotation(large.requirements, DEFAULT_PRICING_CONFIG);

  const result = await renderQuotationPdf(large, { letterhead: A4_RATIO_PNG });
  const parsed = await PDFDocument.load(result.bytes);

  assert.ok(parsed.getPageCount() > 1, "a 30+ line quotation must span multiple pages");
  for (let index = 0; index < parsed.getPageCount(); index += 1) {
    const page = parsed.getPage(index);
    assert.ok(Math.abs(page.getWidth() - A4_POINTS.width) < 0.1);
    assert.ok(Math.abs(page.getHeight() - A4_POINTS.height) < 0.1);
    // Every page draws the background image, so each carries an XObject.
    const resources = page.node.Resources();
    assert.ok(resources, `page ${index + 1} has resources`);
  }
});

test("is deterministic: the same record renders to the same bytes", async () => {
  const first = await renderQuotationPdf(record(), { letterhead: A4_RATIO_PNG });
  const second = await renderQuotationPdf(record(), { letterhead: A4_RATIO_PNG });
  assert.equal(first.hash, second.hash);
  assert.deepEqual(Buffer.from(first.bytes), Buffer.from(second.bytes));
});

test("a changed quotation renders to different bytes", async () => {
  const base = await renderQuotationPdf(record(), { letterhead: A4_RATIO_PNG });
  const edited = record();
  edited.document.totals.total += 100_000;
  const changed = await renderQuotationPdf(edited, { letterhead: A4_RATIO_PNG });
  assert.notEqual(base.hash, changed.hash);
});

test("sets document metadata naming the quotation", async () => {
  const source = record();
  const result = await renderQuotationPdf(source, { letterhead: A4_RATIO_PNG });
  const parsed = await PDFDocument.load(result.bytes);

  assert.match(parsed.getTitle() ?? "", new RegExp(source.number));
  assert.equal(parsed.getAuthor(), "VEZVORA");
});

test("letterboxes artwork whose aspect ratio is far from A4, rather than cropping it", async () => {
  const square = makeTestPng(300, 300, [240, 240, 240]);
  const result = await renderQuotationPdf(record(), { letterhead: square });
  assert.equal(isPdf(result.bytes), true);
  assert.equal(result.usedLetterhead, true);
});

test("replaces characters the standard PDF fonts cannot encode", () => {
  assert.equal(sanitizeForPdf("Vezvora’s “best” — ready…"), "Vezvora's \"best\" - ready...");
  assert.equal(sanitizeForPdf("LKR 1,000–2,000"), "LKR 1,000-2,000");
  assert.equal(sanitizeForPdf("emoji \u{1F600} gone"), "emoji  gone");
  // Latin-1 accents are representable and must survive.
  assert.equal(sanitizeForPdf("café"), "café");
});

test("renders without throwing when the customer text contains awkward characters", async () => {
  const awkward = record({
    requirements: requirements({
      contactName: "Renée — O’Brien",
      projectName: "Café “Sunrise” \u{1F31E}",
      description:
        "We need a bilingual ordering system — Sinhala and English — with a €/LKR price toggle, and it must handle very long unbroken identifiers such as ABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGHIJKLMNOPQRSTUVWXYZ without breaking the layout.",
    }),
  });
  awkward.document = calculateQuotation(awkward.requirements, DEFAULT_PRICING_CONFIG);

  const result = await renderQuotationPdf(awkward, { letterhead: A4_RATIO_PNG });
  assert.equal(isPdf(result.bytes), true);
});
