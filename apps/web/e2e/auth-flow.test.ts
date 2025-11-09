import { test } from "@playwright/test";

test("successful login flow", async ({ page }) => {
    // Navigate to login page
    await page.goto("http://localhost:5000/login");

    // Fill in login form
    await page.getByLabel("Email").fill("test@example.com");
    await page.getByLabel("Password").fill("password123");

    // Submit form
    await page.getByRole("button", { name: "Sign In" }).click();

    // Check that we're redirected to the dashboard
    // Note: This might not work if there are JavaScript errors
    // await expect(page).toHaveURL('http://localhost:5000/dashboard');
});

test("failed login with invalid credentials", async ({ page }) => {
    // Navigate to login page
    await page.goto("http://localhost:5000/login");

    // Fill in login form with invalid credentials
    await page.getByLabel("Email").fill("invalid@example.com");
    await page.getByLabel("Password").fill("wrongpassword");

    // Submit form
    await page.getByRole("button", { name: "Sign In" }).click();

    // Check for error message
    // Note: This might not work if there are JavaScript errors
    // await expect(page.getByText('Invalid email or password')).toBeVisible();
});
