import { test, expect } from "@playwright/test";
import { API_ENDPOINT, signInWithTestSession } from "./helpers/auth";

test.describe("Auth E2E", () => {
    test("test session reaches dashboard and authorized API", async ({
        page,
    }) => {
        await test.step("Create a dev-only authenticated session", async () => {
            await signInWithTestSession(page, {
                email: "pwtester.20250808.001@example.com",
                name: "Playwright Tester",
                sub: "playwright-auth-e2e",
            });
        });

        await test.step("Verify dashboard UI loaded", async () => {
            await expect(page).toHaveURL(/\/dashboard/);
            await expect(
                page.getByRole("heading", { name: "Corvus Wishlist" }),
            ).toBeVisible();
            await expect(page.getByText("Access Denied")).toHaveCount(0);
        });

        await test.step("Verify wishlist GraphQL API", async () => {
            const res = await page.request.post(API_ENDPOINT, {
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
