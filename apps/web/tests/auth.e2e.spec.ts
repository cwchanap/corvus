import { test, expect } from "@playwright/test";

// E2E authentication flow: login -> (fallback register) -> dashboard -> API authorized
// Uses baseURL from playwright.config.ts (http://localhost:5000)

test.describe("Auth E2E", () => {
  const EMAIL = "pwtester.20250808.001@example.com";
  const PASSWORD = "Password123!";
  const NAME = "Playwright Tester";

  test("login or register, then see dashboard and authorized API", async ({
    page,
  }) => {
    // Try login first
    await test.step("Navigate to login and attempt to sign in", async () => {
      await page.goto("/login");
      await page.getByLabel("Email").fill(EMAIL);
      await page.getByLabel("Password").fill(PASSWORD);

      const toDashboard = page
        .waitForURL("**/dashboard", { timeout: 5000 })
        .then(() => true)
        .catch(() => false);

      await page.getByRole("button", { name: "Sign In" }).click();

      const success = await toDashboard;
      if (!success) {
        // If login failed, try to register
        const hasError = await page
          .getByText("Invalid email or password")
          .isVisible();
        if (hasError) {
          await page.goto("/register");
          await page.getByLabel("Full Name").fill(NAME);
          await page.getByLabel("Email").fill(EMAIL);
          await page.getByLabel("Password").fill(PASSWORD);

          await page.getByRole("button", { name: "Create Account" }).click();
          await page.waitForURL("**/dashboard", { timeout: 10000 });
        }
      }
    });

    // Verify dashboard shows and not access denied
    await test.step("Verify dashboard UI loaded", async () => {
      await expect(page).toHaveURL(/\/dashboard/);
      await expect(
        page.getByRole("heading", { name: "Corvus Wishlist" }),
      ).toBeVisible();
      await expect(page.getByText("Access Denied")).toHaveCount(0);
    });

    // Verify wishlist GraphQL API is authorized and returns expected shape
    await test.step("Verify wishlist GraphQL API", async () => {
      // Use page.request so that session cookies from the browser context are sent
      const res = await page.request.post("/graphql", {
        data: {
          query: `
            query {
              wishlist {
                categories {
                  id
                  name
                  color
                }
                items {
                  id
                  title
                  categoryId
                }
                pagination {
                  totalItems
                  page
                  pageSize
                }
              }
            }
          `,
        },
      });
      expect(res.ok()).toBeTruthy();
      const json = await res.json();

      // GraphQL response format: { data: { wishlist: { ... } } }
      expect(json).toHaveProperty("data");
      expect(json.data).toHaveProperty("wishlist");
      expect(json.data.wishlist).toHaveProperty("categories");
      expect(json.data.wishlist).toHaveProperty("items");
      expect(json.data.wishlist).toHaveProperty("pagination");
      expect(Array.isArray(json.data.wishlist.categories)).toBe(true);
      expect(Array.isArray(json.data.wishlist.items)).toBe(true);
    });
  });
});
