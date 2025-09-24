import { test, expect } from "@playwright/test";

// Test account credentials
const TEST_USER = {
  name: "Test User",
  email: "test@example.com",
  password: "password",
};

test.describe("Authentication Flow", () => {
  test("should register a new user and login", async ({ page }) => {
    // Navigate to the register page
    await page.goto("/register");

    // Fill out the registration form
    await page.getByLabel("Full Name").fill(TEST_USER.name);
    await page.getByLabel("Email").fill(TEST_USER.email);
    await page.getByLabel("Password").fill(TEST_USER.password);

    // Submit the form
    await page.getByRole("button", { name: "Create Account" }).click();

    // Should be redirected to dashboard after successful registration
    await expect(page).toHaveURL("/dashboard");

    // Check that user name is displayed
    await expect(page.getByText(TEST_USER.name)).toBeVisible();

    // Logout
    await page.getByRole("button", { name: "Logout" }).click();

    // Should be redirected to home page
    await expect(page).toHaveURL("/");
  });

  test("should login with existing user", async ({ page }) => {
    // Navigate to the login page
    await page.goto("/login");

    // Fill out the login form
    await page.getByLabel("Email").fill(TEST_USER.email);
    await page.getByLabel("Password").fill(TEST_USER.password);

    // Submit the form
    await page.getByRole("button", { name: "Sign In" }).click();

    // Should be redirected to dashboard after successful login
    await expect(page).toHaveURL("/dashboard");

    // Check that user name is displayed
    await expect(page.getByText(TEST_USER.name)).toBeVisible();
  });

  test("should show error for invalid login", async ({ page }) => {
    // Navigate to the login page
    await page.goto("/login");

    // Fill out the login form with invalid credentials
    await page.getByLabel("Email").fill("invalid@example.com");
    await page.getByLabel("Password").fill("wrongpassword");

    // Submit the form
    await page.getByRole("button", { name: "Sign In" }).click();

    // Should show error message
    await expect(page.getByText("Invalid email or password")).toBeVisible();

    // Should stay on login page
    await expect(page).toHaveURL("/login");
  });
});
