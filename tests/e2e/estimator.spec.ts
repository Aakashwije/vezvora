import { expect, test } from "@playwright/test";
import { completeEstimator, uniqueProjectName } from "./helpers";

test.describe("Public instant estimate", () => {
  test("is reachable from the pricing page", async ({ page }) => {
    await page.goto("/pricing");
    await expect(
      page.getByRole("heading", { name: "Get an instant estimate for your project." }),
    ).toBeVisible();

    await page.getByRole("link", { name: "Get an instant estimate" }).click();
    await expect(page).toHaveURL(/\/quotation$/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("approximate quotation");
  });

  test("shows the confirmation with a quotation number, range and delivery window", async ({
    page,
  }) => {
    const projectName = uniqueProjectName("E2E Estimator");
    const number = await completeEstimator(page, { projectName });

    await expect(page.getByTestId("quotation-number")).toHaveText(number);
    await expect(page.getByTestId("quotation-range")).toContainText("LKR");
    await expect(page.getByText(/weeks from kick-off/)).toBeVisible();
    await expect(
      page.getByText(/This is an approximate quotation based on the information provided/),
    ).toBeVisible();
    await expect(page.getByText(/e2e\.customer@example\.lk/)).toBeVisible();
  });

  test("blocks progress and reports accessible errors for invalid input", async ({ page }) => {
    await page.goto("/quotation");

    // Empty first step cannot advance.
    await page.getByRole("button", { name: "Continue" }).click();
    const nameError = page.getByText("Please enter your name.");
    await expect(nameError).toBeVisible();
    await expect(page.getByLabel("Your name")).toHaveAttribute("aria-invalid", "true");
    await expect(page.getByRole("heading", { name: "How can we reach you?" })).toBeVisible();

    // A malformed email is rejected too.
    await page.getByLabel("Your name").fill("Sahan Perera");
    await page.getByLabel("Email address").fill("not-an-email");
    await page.getByLabel("Phone or WhatsApp").fill("+94 77 123 4567");
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page.getByText("Please enter a valid email address.")).toBeVisible();

    // Correcting it clears the error and advances.
    await page.getByLabel("Email address").fill("sahan@example.lk");
    await expect(page.getByText("Please enter a valid email address.")).toHaveCount(0);
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page.getByRole("heading", { name: "What are we building?" })).toBeVisible();
  });

  test("supports going back to change an earlier answer", async ({ page }) => {
    await page.goto("/quotation");
    await page.getByLabel("Your name").fill("Sahan Perera");
    await page.getByLabel("Email address").fill("sahan@example.lk");
    await page.getByLabel("Phone or WhatsApp").fill("+94 77 123 4567");
    await page.getByRole("button", { name: "Continue" }).click();

    await expect(page.getByRole("heading", { name: "What are we building?" })).toBeVisible();
    await page.getByRole("button", { name: "Back" }).click();

    await expect(page.getByRole("heading", { name: "How can we reach you?" })).toBeVisible();
    await expect(page.getByLabel("Your name")).toHaveValue("Sahan Perera");
  });

  test("reports progress through the five steps", async ({ page }) => {
    await page.goto("/quotation");
    const progress = page.getByRole("progressbar");
    await expect(progress).toHaveAttribute("aria-valuenow", "1");
    await expect(page.getByText("Step 1 of 5")).toBeVisible();

    await page.getByLabel("Your name").fill("Sahan Perera");
    await page.getByLabel("Email address").fill("sahan@example.lk");
    await page.getByLabel("Phone or WhatsApp").fill("+94 77 123 4567");
    await page.getByRole("button", { name: "Continue" }).click();

    await expect(progress).toHaveAttribute("aria-valuenow", "2");
    await expect(page.getByText("Step 2 of 5")).toBeVisible();
  });
});
