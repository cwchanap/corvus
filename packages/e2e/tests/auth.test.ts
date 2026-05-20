import { test, expect } from "@playwright/test";
import { signInWithTestSession } from "./helpers/auth";

test.describe("Google-only auth surface", () => {
    test("register route redirects to login", async ({ page }) => {
        await page.goto("/register");
        await expect(page).toHaveURL(/\/login/);
        await expect(
            page.getByRole("link", { name: "Continue with Google" }),
        ).toBeVisible();
    });

    test("authenticated test session can sign out", async ({ page }) => {
        await signInWithTestSession(page, {
            email: "logout.20250808.001@example.com",
            name: "Logout Tester",
            sub: "playwright-logout-e2e",
        });

        await page.goto("/profile");
        await page.getByRole("button", { name: "Sign Out" }).click();

        await expect(page).toHaveURL(/\/login|\/$/);
    });
});
