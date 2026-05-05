import { test, expect } from "@playwright/test";

// Runs against whatever `baseURL` Playwright is configured with. Point
// `PLAYWRIGHT_BASE_URL=https://<deployment>.vercel.app` at prod to verify
// the deployed app end-to-end.

test.describe("prod smoke", () => {
  test("home responds 200", async ({ page }) => {
    const response = await page.goto("/");
    expect(response?.ok()).toBe(true);
    await expect(
      page.getByRole("heading", { name: /maquette/i }),
    ).toBeVisible();
  });

  test("unknown short code returns 404 (redirect handler alive)", async ({
    request,
  }) => {
    const response = await request.get("/r/ZZZZZZ9", {
      maxRedirects: 0,
      failOnStatusCode: false,
    });
    expect(response.status()).toBe(404);
  });

  test("/dashboard is gated behind auth", async ({ page }) => {
    const response = await page.goto("/dashboard");
    expect(response?.ok() || response?.status() === 307).toBe(true);
    await expect(page).toHaveURL(/\/login/);
  });
});
