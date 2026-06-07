import { test, expect } from "@playwright/test";
import { signInWithTestSession } from "./helpers/auth";

test.describe("Google-only auth surface", () => {
    test("signup route offers Google sign up", async ({ page }) => {
        await page.goto("/signup");
        await expect(page).toHaveURL(/\/signup/);
        await expect(
            page.getByRole("link", { name: "Sign up with Google" }),
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

        await expect(page).toHaveURL(/\/signin|\/$/);
    });
});
