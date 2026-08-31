import { expect, test } from "@playwright/test";
import { completeEstimator, loginAsAdmin, uniqueProjectName } from "./helpers";

test.describe("Responsive behaviour", () => {
  test("the estimator is usable on a phone without horizontal scrolling", async ({ page }) => {
    await page.goto("/quotation");

    const overflows = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    );
    expect(overflows, "the page must not scroll sideways").toBe(false);

    // Controls stack full width and stay reachable.
    const continueButton = page.getByRole("button", { name: "Continue" });
    await expect(continueButton).toBeVisible();
    const box = await continueButton.boundingBox();
    const viewport = page.viewportSize()!;
    expect(box!.width).toBeGreaterThan(viewport.width * 0.6);
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(viewport.width + 1);
  });

  test("completes end to end on a phone viewport", async ({ page }) => {
    const projectName = uniqueProjectName("E2E Mobile");
    const number = await completeEstimator(page, { projectName });

    await expect(page.getByTestId("quotation-number")).toHaveText(number);
    await expect(page.getByTestId("quotation-range")).toBeVisible();

    const overflows = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    );
    expect(overflows).toBe(false);
  });

  test("the pricing estimate section reflows on a phone", async ({ page }) => {
    await page.goto("/pricing");
    await expect(
      page.getByRole("heading", { name: "Get an instant estimate for your project." }),
    ).toBeVisible();

    const overflows = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    );
    expect(overflows).toBe(false);
  });

  test("the dashboard action centre stacks rather than compressing on a phone", async ({
    page,
  }) => {
    await completeEstimator(page, { projectName: uniqueProjectName("E2E Mob Dash") });
    await loginAsAdmin(page);
    await page.goto("/admin");

    const overflows = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    );
    expect(overflows, "the dashboard must not scroll sideways").toBe(false);

    // Each queued row keeps its actions reachable at a thumb-sized width.
    const row = page.getByRole("listitem").first();
    await expect(row).toBeVisible();
    const button = row.getByRole("link", { name: /Review/ });
    const box = await button.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeGreaterThan(60);
  });
});
