import { test, expect } from "@playwright/test";

test("signin page offers Google SSO only", async ({ page }) => {
    await page.goto("/signin");
    await expect(page).toHaveURL(/\/signin/);
    await expect(page.getByText("Welcome Back")).toBeVisible();
    await expect(
        page.getByRole("link", { name: "Continue with Google" }),
    ).toBeVisible();
    await expect(page.getByLabel("Email Address")).toHaveCount(0);
    await expect(page.getByLabel("Password")).toHaveCount(0);
});
