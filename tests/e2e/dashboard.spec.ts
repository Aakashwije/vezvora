import { expect, test } from "@playwright/test";
import { completeEstimator, loginAsAdmin, uniqueProjectName } from "./helpers";

test.describe("Dashboard action centre", () => {
  test("a withheld quotation is queued and can be approved without opening it", async ({
    page,
  }) => {
    const projectName = uniqueProjectName("E2E Dash");
    const number = await completeEstimator(page, { projectName });

    await loginAsAdmin(page);
    await page.goto("/admin");

    const row = page.getByRole("listitem").filter({ hasText: number });
    await expect(row).toBeVisible();
    await expect(row).toContainText(projectName);
    await expect(row).toContainText(/value ceiling/i);

    // The decision is available inline; the record never has to be opened.
    await row.getByRole("button", { name: "Approve" }).click();
    await expect(page.getByText(`${number}: approved`)).toBeVisible();

    // It leaves the approval queue and joins the ones counting down to a send,
    // so the approve control is gone and the reason has changed.
    const released = page.getByRole("listitem").filter({ hasText: number });
    await expect(released).toContainText(/Emails the customer automatically/);
    await expect(released.getByRole("button", { name: "Approve" })).toHaveCount(0);
    await expect(released.getByRole("button", { name: "Send" })).toBeVisible();
  });

  test("an unassigned lead can be given an owner from the queue", async ({ page }) => {
    // Raised through the public contact form, so the lead arrives unowned
    // exactly as a real enquiry would.
    const who = `E2E Lead ${Date.now().toString(36)}`;
    await page.goto("/contact");
    await page.getByLabel("Name", { exact: true }).fill(who);
    await page.getByLabel("Email", { exact: true }).fill("e2e.lead@example.lk");
    await page.getByLabel("Message").fill(
      "We are opening four new branches next quarter and need a system to run them.",
    );
    await page.getByRole("button", { name: "Submit inquiry" }).click();
    await expect(page.getByText("Thanks — your inquiry is in.")).toBeVisible({ timeout: 30_000 });

    await loginAsAdmin(page);
    await page.goto("/admin");

    const row = page.getByRole("listitem").filter({ hasText: who });
    await expect(row).toContainText("New enquiry with nobody assigned to it.");

    await row.getByRole("combobox").selectOption({ label: "Aakash" });
    await expect(page.getByText(/assigned to Aakash/)).toBeVisible();

    // With an owner it drops out of the unassigned queue.
    await expect(
      page.getByRole("listitem").filter({ hasText: "New enquiry with nobody assigned to it." }),
    ).toHaveCount(0);
  });

  test("the reporting period is driven by the URL", async ({ page }) => {
    await loginAsAdmin(page);

    await page.goto("/admin?range=7d");
    await expect(page.getByRole("button", { name: "7 days" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await expect(page.getByText("Reporting on the last 7 days.")).toBeVisible();

    // Switching period rewrites the URL rather than holding it in memory.
    await page.getByRole("button", { name: "90 days" }).click();
    await expect(page).toHaveURL(/range=90d/);
    await expect(page.getByText("Reporting on the last 90 days.")).toBeVisible();

    // A custom period exposes both date pickers.
    await page.goto("/admin?range=custom&from=2026-08-01&to=2026-08-15");
    await expect(page.getByLabel("From")).toHaveValue("2026-08-01");
    await expect(page.getByLabel("To")).toHaveValue("2026-08-15");
  });

  test("a nonsense period falls back instead of breaking the page", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/admin?range=%3Cscript%3E&from=nope");
    await expect(page.getByText("Reporting on the last 30 days.")).toBeVisible();
    await expect(page.getByRole("heading", { level: 1, name: "Dashboard" })).toBeVisible();
  });
});
