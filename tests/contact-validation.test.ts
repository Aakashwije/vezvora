import test from "node:test";
import assert from "node:assert/strict";
import { validateContactForm } from "../src/app/contact/validation.ts";
import { budgetRanges, projectTypes } from "../src/content/contact-options.ts";

function form(overrides: Record<string, string> = {}) {
  const data = new FormData();
  data.set("name", "Aakash");
  data.set("email", "AAKASH@EXAMPLE.COM");
  data.set("company", "Vezvora");
  data.set("phone", "+94 71 357 9967");
  data.set("projectType", projectTypes[0]);
  data.set("budget", budgetRanges[0]);
  data.set("message", "We need a production-ready platform.");
  for (const [key, value] of Object.entries(overrides)) data.set(key, value);
  return data;
}

test("accepts and normalizes a valid contact submission", () => {
  const result = validateContactForm(form());
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.payload.email, "aakash@example.com");
  assert.equal(result.payload.name, "Aakash");
});

test("rejects invalid email addresses", () => {
  const result = validateContactForm(form({ email: "not-an-email" }));
  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.match(result.error, /valid email/i);
});

test("rejects tampered option values", () => {
  const result = validateContactForm(form({ projectType: "Other hacked value" }));
  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.match(result.error, /project type/i);
});
