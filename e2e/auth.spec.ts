import { test, expect } from "@playwright/test";

test.describe("auth gating", () => {
  test("unauthenticated /dashboard redirects to /login", async ({ page }) => {
    const response = await page.goto("/dashboard");
    expect(response?.ok() || response?.status() === 307).toBe(true);
    await expect(page).toHaveURL(/\/login/);
  });

  test("/login page renders email/password form and google OAuth button", async ({
    page,
  }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: /sign in/i })).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(
      page.getByRole("button", { name: /sign in with google/i }),
    ).toBeVisible();
  });
});
