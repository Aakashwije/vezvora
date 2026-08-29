import { expect, type Page } from "@playwright/test";

export const ADMIN_EMAIL = "vezvoraa@gmail.com";
export const ADMIN_PASSWORD = "e2e-admin-password";

/** Distinct project name per run so specs never collide in the shared store. */
export function uniqueProjectName(prefix: string): string {
  return `${prefix} ${Date.now().toString(36)}${Math.floor(Math.random() * 1e4)}`;
}

type EstimateOptions = {
  projectName: string;
  email?: string;
  contactName?: string;
};

/**
 * Walk the public five-step estimator to completion and return the generated
 * quotation number from the confirmation screen.
 */
export async function completeEstimator(
  page: Page,
  { projectName, email = "e2e.customer@example.lk", contactName = "Sahan Perera" }: EstimateOptions,
): Promise<string> {
  await page.goto("/quotation");
  // Scoped to the form: the site footer also has a "Company" landmark.
  const form = page.getByRole("form", { name: "Instant estimate" });

  // Step 1 — contact details
  await expect(page.getByRole("heading", { name: "How can we reach you?" })).toBeVisible();
  await form.getByLabel("Your name").fill(contactName);
  await form.getByLabel("Company").fill("Lanka Digital");
  await form.getByLabel("Email address").fill(email);
  await form.getByLabel("Phone or WhatsApp").fill("+94 77 123 4567");
  await form.getByRole("button", { name: "Continue" }).click();

  // Step 2 — the project
  await expect(page.getByRole("heading", { name: "What are we building?" })).toBeVisible();
  await form.getByLabel("Project or product name").fill(projectName);
  await form.getByRole("radio", { name: /^POS system/ }).check();
  await form
    .getByLabel("Project description")
    .fill(
      "A point of sale and inventory platform for a twelve branch retail chain. Cashiers need offline billing at the counter with nightly stock synchronisation, head office needs consolidated sales reporting, and finance needs the day's takings posted into the accounting system automatically.",
    );
  await form.getByRole("button", { name: "Continue" }).click();

  // Step 3 — scope
  await expect(page.getByRole("heading", { name: "What does it need to do?" })).toBeVisible();
  await form.getByRole("checkbox", { name: "Web browser" }).check();
  await form.getByRole("checkbox", { name: "POS terminal" }).check();
  await form.getByRole("checkbox", { name: "Accounts & authentication" }).check();
  await form.getByRole("checkbox", { name: "Inventory management" }).check();
  await form.getByRole("checkbox", { name: "Reporting & analytics" }).check();
  await form.getByRole("checkbox", { name: "Payment gateway" }).check();
  await form.getByRole("button", { name: "Continue" }).click();

  // Step 4 — delivery
  await expect(page.getByRole("heading", { name: "Design, scale, and pace" })).toBeVisible();
  // Option labels include their hint text, so match on the label prefix.
  await form.getByRole("radio", { name: /^Custom design/ }).check();
  await form.getByLabel("Expected user volume").selectOption("medium");
  await form.getByLabel("Preferred timeline").selectOption("standard");
  await form.getByRole("button", { name: "Continue" }).click();

  // Step 5 — consent and submit
  await expect(page.getByRole("heading", { name: "Anything else we should know?" })).toBeVisible();
  await form.getByRole("checkbox", { name: /I agree that Vezvora may contact me/ }).check();
  await form.getByRole("button", { name: "Get my estimate" }).click();

  await expect(page.getByRole("heading", { name: "Your estimate is ready." })).toBeVisible({
    timeout: 30_000,
  });

  const number = (await page.getByTestId("quotation-number").innerText()).trim();
  expect(number).toMatch(/^VZQ-\d{4}-\d{4}$/);
  return number;
}

/** Sign in to the admin console. */
export async function loginAsAdmin(page: Page): Promise<void> {
  await page.goto("/admin/login");
  await page.getByLabel(/email/i).fill(ADMIN_EMAIL);
  await page.getByLabel(/password/i).fill(ADMIN_PASSWORD);
  await page.getByRole("button", { name: /sign in/i }).click();
  // Assert on the console chrome, not just the URL: a rejected sign-in stays on
  // /admin/login, which a loose URL pattern would happily match.
  await expect(page.getByRole("navigation", { name: "Admin" })).toBeVisible();
}
