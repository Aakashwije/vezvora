import { expect, test } from "@playwright/test";
import { completeEstimator, loginAsAdmin, uniqueProjectName } from "./helpers";

test.describe("Admin quotation review", () => {
  test("an ordinary request appears in the console with a live review countdown", async ({
    page,
  }) => {
    const projectName = uniqueProjectName("E2E Review");
    // A modest, well-described brief: the confidence rules clear it, so it is
    // counting down to an automatic send.
    const number = await completeEstimator(page, { projectName, variant: "website" });

    await loginAsAdmin(page);
    await page.goto("/admin/quotations");

    await page.getByLabel("Search quotations").fill(number);
    const row = page.getByRole("row", { name: new RegExp(number) });
    await expect(row).toBeVisible();
    await expect(row).toContainText(projectName);
    await expect(row).toContainText("Pending review");
    // The countdown ticks down from ten minutes.
    await expect(row.getByText(/^\d+:\d{2}$/)).toBeVisible();

    await row.getByRole("link", { name: "Review" }).click();
    await expect(page.getByRole("heading", { level: 1, name: number })).toBeVisible();
    await expect(page.getByText("Original requirements")).toBeVisible();
    await expect(page.getByText(/marketing website for a tea estate/)).toBeVisible();
    await expect(page.getByText("High confidence")).toBeVisible();
  });

  test("a high-value request is withheld until an administrator approves it", async ({ page }) => {
    const projectName = uniqueProjectName("E2E Approval");
    // A twelve-branch POS platform: well above the value ceiling, so it must
    // not be emailed on its own.
    const number = await completeEstimator(page, { projectName });

    await loginAsAdmin(page);
    await page.goto("/admin/quotations");

    await page.getByLabel("Search quotations").fill(number);
    const row = page.getByRole("row", { name: new RegExp(number) });
    // No countdown: there is nothing to count down to until it is approved.
    await expect(row).toContainText("Approval");
    await expect(row.getByText(/^\d+:\d{2}$/)).toHaveCount(0);

    await row.getByRole("link", { name: "Review" }).click();
    await expect(page.getByText("This estimate will not be emailed on its own")).toBeVisible();
    // The reason is repeated in the flag list beneath it, so match the first.
    await expect(page.getByText(/value ceiling/i).first()).toBeVisible();
    await expect(page.getByText(/until auto-send/)).toHaveCount(0);

    // Approving releases it, and the review window starts counting down.
    await page.getByRole("button", { name: "Approve" }).click();
    await expect(page.getByText("Marked as approved.")).toBeVisible();
    await expect(page.getByText("This estimate will not be emailed on its own")).toHaveCount(0);
    await expect(page.getByText(/until auto-send/)).toBeVisible();
  });

  test("the console can be filtered down to the requests awaiting approval", async ({ page }) => {
    const projectName = uniqueProjectName("E2E Queue");
    const number = await completeEstimator(page, { projectName });

    await loginAsAdmin(page);
    await page.goto("/admin/quotations");

    await page.getByRole("button", { name: /^Needs approval/ }).click();
    await page.getByLabel("Search quotations").fill(number);
    await expect(page.getByRole("row", { name: new RegExp(number) })).toBeVisible();
  });

  test("an administrator can edit a line item and send the quotation manually", async ({ page }) => {
    const projectName = uniqueProjectName("E2E Edit");
    const number = await completeEstimator(page, { projectName });

    await loginAsAdmin(page);
    await page.goto("/admin/quotations");
    await page.getByLabel("Search quotations").fill(number);
    await page.getByRole("row", { name: new RegExp(number) }).getByRole("link", { name: "Review" }).click();

    // Change the core build price and save a revision.
    const firstUnitPrice = page.getByLabel("Unit price").first();
    await firstUnitPrice.fill("1500000");
    await page.getByRole("button", { name: "Save changes" }).click();
    await expect(page.getByText(/Saved as revision 1\./)).toBeVisible();
    await expect(page.getByText("Revision 1 · Aakash")).toBeVisible();
    await expect(page.getByText(/unit price/i).first()).toBeVisible();

    // The status moves out of pending review once it has been edited.
    await expect(page.getByText("Updated").first()).toBeVisible();

    // Send it now, ahead of the automatic deadline.
    await page.getByRole("button", { name: "Send now" }).click();
    await expect(page.getByText("Quotation emailed to the customer.")).toBeVisible();
    await expect(page.getByText("Sent").first()).toBeVisible();

    // Editing controls are locked once it has gone out.
    await expect(page.getByRole("button", { name: "Save changes" })).toBeDisabled();
    await expect(page.getByRole("button", { name: "Send now" })).toBeDisabled();
  });

  test("holding a quotation stops the automatic send and can be resumed", async ({ page }) => {
    const projectName = uniqueProjectName("E2E Hold");
    // A cleared estimate, so the countdown is what the hold has to stop.
    const number = await completeEstimator(page, { projectName, variant: "website" });

    await loginAsAdmin(page);
    await page.goto("/admin/quotations");
    await page.getByLabel("Search quotations").fill(number);
    await page.getByRole("row", { name: new RegExp(number) }).getByRole("link", { name: "Review" }).click();

    await page.getByRole("button", { name: "Hold" }).click();
    await expect(page.getByText("Marked as held.")).toBeVisible();
    await expect(page.getByText("On hold").first()).toBeVisible();
    await expect(
      page.getByText("Auto-send paused. Nothing goes out until you resume or send."),
    ).toBeVisible();

    // A held quotation shows no countdown.
    await expect(page.getByText(/until auto-send/)).toHaveCount(0);

    await page.getByRole("button", { name: "Resume review" }).click();
    await expect(page.getByText("Marked as pending review.")).toBeVisible();
    await expect(page.getByText(/until auto-send/)).toBeVisible();
  });

  test("cancelling keeps the quotation out of the send queue", async ({ page }) => {
    const projectName = uniqueProjectName("E2E Cancel");
    const number = await completeEstimator(page, { projectName });

    await loginAsAdmin(page);
    await page.goto("/admin/quotations");
    await page.getByLabel("Search quotations").fill(number);
    await page.getByRole("row", { name: new RegExp(number) }).getByRole("link", { name: "Review" }).click();

    await page.getByRole("button", { name: "Cancel" }).click();
    await expect(page.getByText("Marked as cancelled.")).toBeVisible();
    await expect(page.getByText("Will not be sent.")).toBeVisible();
  });

  test("the console is protected by authentication", async ({ page }) => {
    await page.context().clearCookies();
    await page.goto("/admin/quotations");
    await expect(page).toHaveURL(/\/admin\/login/);
    await expect(page.getByLabel("Password")).toBeVisible();
  });

  test("the PDF endpoint refuses anonymous requests", async ({ page, request }) => {
    const projectName = uniqueProjectName("E2E Pdf");
    const number = await completeEstimator(page, { projectName });

    await loginAsAdmin(page);
    await page.goto("/admin/quotations");
    await page.getByLabel("Search quotations").fill(number);

    // The detail page embeds the PDF preview, so opening it exercises the real
    // authenticated request rather than a synthetic one.
    const preview = page.waitForResponse((response) => /\/pdf(\?|$)/.test(response.url()));
    await page
      .getByRole("row", { name: new RegExp(number) })
      .getByRole("link", { name: "Review" })
      .click();

    const rendered = await preview;
    expect(rendered.status()).toBe(200);
    expect(rendered.headers()["content-type"]).toContain("application/pdf");

    await page.waitForURL(/\/admin\/quotations\/qt_[0-9a-f-]+$/);
    const id = page.url().split("/").pop()!;

    // The same URL without the session cookie is refused.
    const anonymous = await request.get(`/api/quotations/${id}/pdf`);
    expect(anonymous.status()).toBe(401);
  });
});
