import { test, expect, type APIRequestContext } from "@playwright/test";

const API_ENDPOINT =
    // eslint-disable-next-line turbo/no-undeclared-env-vars
    process.env.VITE_API_URL ?? "http://localhost:5002/graphql";

const createTestUser = () => ({
    name: "Test User",
    email: `test.user.${Date.now()}.${Math.random()
        .toString(36)
        .slice(2, 8)}@example.com`,
    password: "password123",
});

const registerUserViaApi = async (
    request: APIRequestContext,
    user: ReturnType<typeof createTestUser>,
) => {
    const response = await request.post(API_ENDPOINT, {
        data: {
            query: `
      mutation Register($input: RegisterInput!) {
        register(input: $input) {
          success
          error
        }
      }
      `,
            variables: {
                input: {
                    name: user.name,
                    email: user.email,
                    password: user.password,
                },
            },
        },
    });

    expect(response.ok()).toBeTruthy();
    const json = await response.json();
    if (!json?.data?.register?.success) {
        throw new Error(
            json?.data?.register?.error ??
                "Failed to register test user via API",
        );
    }
};

test.describe("Authentication Flow", () => {
    test("should register a new user and login", async ({ page }) => {
        // Navigate to the register page
        await page.goto("/register");

        // Fill out the registration form
        const testUser = createTestUser();

        await page.getByLabel("Full Name").fill(testUser.name);
        await page.getByLabel("Email Address").fill(testUser.email);
        await page.getByLabel("Password").fill(testUser.password);

        // Submit the form
        await page.getByRole("button", { name: "Create Account" }).click();

        // Should be redirected to dashboard after successful registration
        await expect(page).toHaveURL("/dashboard");

        // Check that user name is displayed
        await expect(page.getByText(testUser.name)).toBeVisible();

        // Logout
        await page.getByRole("button", { name: "Sign Out" }).click();

        // Should be redirected to home page
        await expect(page).toHaveURL("/");
    });

    test("should login with existing user", async ({ page }) => {
        // Navigate to the login page
        const testUser = createTestUser();
        await registerUserViaApi(page.request, testUser);

        await page.goto("/login");

        // Fill out the login form
        await page.getByLabel("Email Address").fill(testUser.email);
        await page.getByLabel("Password").fill(testUser.password);

        // Submit the form
        await page.getByRole("button", { name: "Sign In" }).click();

        // Should be redirected to dashboard after successful login
        await expect(page).toHaveURL("/dashboard");

        // Check that user name is displayed
        await expect(page.getByText(testUser.name)).toBeVisible();
    });

    test("should show error for invalid login", async ({ page }) => {
        // Navigate to the login page
        await page.goto("/login");

        // Fill out the login form with invalid credentials
        await page.getByLabel("Email Address").fill("invalid@example.com");
        await page.getByLabel("Password").fill("wrongpassword");

        // Submit the form
        await page.getByRole("button", { name: "Sign In" }).click();

        // Should show error message
        await expect(page.getByText("Invalid email or password")).toBeVisible();

        // Should stay on login page
        await expect(page).toHaveURL("/login");
    });
});
