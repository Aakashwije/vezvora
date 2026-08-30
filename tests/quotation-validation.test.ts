import test from "node:test";
import assert from "node:assert/strict";
import {
  MAX_LENGTHS,
  MIN_DESCRIPTION_LENGTH,
  cleanText,
  submissionFromFormData,
  validateQuotation,
} from "../src/lib/quotation/validation.ts";

function submission(overrides: Record<string, unknown> = {}) {
  return {
    contactName: "Sahan Perera",
    companyName: "Lanka Digital",
    email: "SAHAN@EXAMPLE.LK",
    phone: "+94 77 123 4567",
    projectName: "Ceylon Retail POS",
    service: "pos_system",
    description:
      "A point of sale and inventory platform for a twelve branch retail chain with offline billing.",
    platforms: ["web", "pos_terminal"],
    features: ["auth", "inventory"],
    integrations: ["payment_gateway"],
    design: "standard",
    userVolume: "medium",
    timeline: "standard",
    maintenance: "standard",
    budget: "1m_2_5m",
    notes: "",
    consent: "on",
    ...overrides,
  };
}

test("accepts and normalizes a valid estimate submission", () => {
  const result = validateQuotation(submission());
  assert.equal(result.ok, true);
  if (!result.ok) return;

  assert.equal(result.payload.email, "sahan@example.lk");
  assert.equal(result.payload.service, "pos_system");
  assert.deepEqual(result.payload.platforms, ["web", "pos_terminal"]);
  assert.equal(result.payload.consent, true);
});

test("reports a field error for every invalid input", () => {
  const result = validateQuotation(
    submission({
      contactName: "",
      email: "not-an-email",
      phone: "12",
      projectName: "",
      description: "too short",
      platforms: [],
      features: [],
      consent: "",
    }),
  );

  assert.equal(result.ok, false);
  if (result.ok) return;
  for (const field of [
    "contactName",
    "email",
    "phone",
    "projectName",
    "description",
    "platforms",
    "features",
    "consent",
  ] as const) {
    assert.ok(result.errors[field], `expected an error for ${field}`);
  }
});

test("rejects submissions without consent", () => {
  const result = validateQuotation(submission({ consent: undefined }));
  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.match(result.errors.consent ?? "", /agree to be contacted/i);
});

test("requires a meaningful project description", () => {
  const result = validateQuotation(submission({ description: "x".repeat(MIN_DESCRIPTION_LENGTH - 1) }));
  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.match(result.errors.description ?? "", /at least 30 characters/i);
});

test("discards option values that are not in the catalogue", () => {
  const result = validateQuotation(
    submission({
      service: "free_unicorns",
      platforms: ["web", "mainframe", "web"],
      features: ["auth", "self_destruct"],
      integrations: ["payment_gateway", "steal_data"],
    }),
  );

  assert.equal(result.ok, false, "an unknown service must fail");
  if (result.ok) return;
  assert.ok(result.errors.service);

  const valid = validateQuotation(
    submission({ platforms: ["web", "mainframe", "web"], features: ["auth", "self_destruct"] }),
  );
  assert.equal(valid.ok, true);
  if (!valid.ok) return;
  // Unknown entries dropped, duplicates collapsed.
  assert.deepEqual(valid.payload.platforms, ["web"]);
  assert.deepEqual(valid.payload.features, ["auth"]);
});

test("clamps input to the documented maximum lengths", () => {
  const result = validateQuotation(
    submission({
      contactName: "a".repeat(500),
      description: "d".repeat(10_000),
      notes: "n".repeat(10_000),
    }),
  );

  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.payload.contactName.length, MAX_LENGTHS.contactName);
  assert.equal(result.payload.description.length, MAX_LENGTHS.description);
  assert.equal(result.payload.notes.length, MAX_LENGTHS.notes);
});

test("strips angle brackets and control characters from free text", () => {
  const cleaned = cleanText("Hello <script>alert(1)</script>\u0007  world", 200);
  assert.equal(cleaned.includes("<"), false);
  assert.equal(cleaned.includes(">"), false);
  assert.equal(cleaned.includes("\u0007"), false);
  assert.match(cleaned, /Hello/);
});

test("reads multi-value fields out of FormData", () => {
  const data = new FormData();
  data.set("contactName", "Sahan");
  data.append("platforms", "web");
  data.append("platforms", "ios");
  data.append("features", "auth");

  const raw = submissionFromFormData(data);
  assert.deepEqual(raw.platforms, ["web", "ios"]);
  assert.deepEqual(raw.features, ["auth"]);
});

test("defaults an unrecognised budget to undisclosed rather than failing", () => {
  const result = validateQuotation(submission({ budget: "a-trillion" }));
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.payload.budget, "undisclosed");
});
