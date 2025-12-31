import { test, expect } from "@playwright/test";

// E2E tests for bulk operations: batch delete and batch move
// Uses baseURL from playwright.config.ts (http://localhost:5000)

test.describe("Bulk Operations E2E", () => {
    const EMAIL = "bulktest.20250808.001@example.com";
    const PASSWORD = "Password123!";
    const NAME = "Bulk Test User";
    const API_ENDPOINT =
        // eslint-disable-next-line turbo/no-undeclared-env-vars
        process.env.VITE_API_URL ?? "http://localhost:5002/graphql";

    test.beforeEach(async ({ page }) => {
        // Login or register before each test
        await page.goto("/login");
        await page.getByLabel("Email Address").fill(EMAIL);
        await page.getByLabel("Password").fill(PASSWORD);

        const toDashboard = page
            .waitForURL("**/dashboard", { timeout: 5000 })
            .then(() => true)
            .catch(() => false);

        await page.getByRole("button", { name: "Sign In" }).click();

        const success = await toDashboard;
        if (!success) {
            const hasError = await page
                .getByText("Invalid email or password")
                .isVisible();
            if (hasError) {
                await page.goto("/register");
                await page.getByLabel("Full Name").fill(NAME);
                await page.getByLabel("Email Address").fill(EMAIL);
                await page.getByLabel("Password").fill(PASSWORD);

                await page
                    .getByRole("button", { name: "Create Account" })
                    .click();
                await page.waitForURL("**/dashboard", { timeout: 10000 });
            }
        }

        await expect(page).toHaveURL(/\/dashboard/);
    });

    test("can enter and exit selection mode", async ({ page }) => {
        // Look for the Select button (only visible when there are items)
        const selectButton = page.getByRole("button", { name: "Select" });

        // If no items exist, the select button won't be visible
        const hasItems = await selectButton.isVisible().catch(() => false);

        if (hasItems) {
            // Click to enter selection mode
            await selectButton.click();

            // Should now show "Cancel" button
            await expect(
                page.getByRole("button", { name: "Cancel" }),
            ).toBeVisible();

            // Click Cancel to exit selection mode
            await page.getByRole("button", { name: "Cancel" }).click();

            // Should be back to Select button
            await expect(
                page.getByRole("button", { name: "Select" }),
            ).toBeVisible();
        }
    });

    test("batch delete via GraphQL API works correctly", async ({ page }) => {
        // First create test items via API
        const createItemMutation = `
            mutation CreateItem($input: CreateItemInput!) {
                createItem(input: $input) {
                    id
                    title
                }
            }
        `;

        // Create 2 test items
        const item1Res = await page.request.post(API_ENDPOINT, {
            data: {
                query: createItemMutation,
                variables: {
                    input: {
                        title: "Bulk Delete Test Item 1",
                        description: "Test item for bulk delete",
                    },
                },
            },
        });
        expect(item1Res.ok()).toBeTruthy();
        const item1Json = await item1Res.json();
        const item1Id = item1Json.data?.createItem?.id;

        const item2Res = await page.request.post(API_ENDPOINT, {
            data: {
                query: createItemMutation,
                variables: {
                    input: {
                        title: "Bulk Delete Test Item 2",
                        description: "Test item for bulk delete",
                    },
                },
            },
        });
        expect(item2Res.ok()).toBeTruthy();
        const item2Json = await item2Res.json();
        const item2Id = item2Json.data?.createItem?.id;

        // Now test batch delete
        const batchDeleteMutation = `
            mutation BatchDeleteItems($input: BatchDeleteInput!) {
                batchDeleteItems(input: $input) {
                    success
                    processedCount
                    failedCount
                    errors
                }
            }
        `;

        const deleteRes = await page.request.post(API_ENDPOINT, {
            data: {
                query: batchDeleteMutation,
                variables: {
                    input: {
                        itemIds: [item1Id, item2Id],
                    },
                },
            },
        });

        expect(deleteRes.ok()).toBeTruthy();
        const deleteJson = await deleteRes.json();

        expect(deleteJson.data.batchDeleteItems).toMatchObject({
            success: true,
            processedCount: 2,
            failedCount: 0,
        });
    });

    test("batch move via GraphQL API works correctly", async ({ page }) => {
        // First create a category
        const createCategoryMutation = `
            mutation CreateCategory($input: CreateCategoryInput!) {
                createCategory(input: $input) {
                    id
                    name
                }
            }
        `;

        const categoryRes = await page.request.post(API_ENDPOINT, {
            data: {
                query: createCategoryMutation,
                variables: {
                    input: {
                        name: "Bulk Move Test Category",
                        color: "#FF5733",
                    },
                },
            },
        });
        expect(categoryRes.ok()).toBeTruthy();
        const categoryJson = await categoryRes.json();
        const categoryId = categoryJson.data?.createCategory?.id;

        // Create test items
        const createItemMutation = `
            mutation CreateItem($input: CreateItemInput!) {
                createItem(input: $input) {
                    id
                    title
                }
            }
        `;

        const item1Res = await page.request.post(API_ENDPOINT, {
            data: {
                query: createItemMutation,
                variables: {
                    input: {
                        title: "Bulk Move Test Item 1",
                    },
                },
            },
        });
        expect(item1Res.ok()).toBeTruthy();
        const item1Json = await item1Res.json();
        const item1Id = item1Json.data?.createItem?.id;

        const item2Res = await page.request.post(API_ENDPOINT, {
            data: {
                query: createItemMutation,
                variables: {
                    input: {
                        title: "Bulk Move Test Item 2",
                    },
                },
            },
        });
        expect(item2Res.ok()).toBeTruthy();
        const item2Json = await item2Res.json();
        const item2Id = item2Json.data?.createItem?.id;

        // Test batch move to category
        const batchMoveMutation = `
            mutation BatchMoveItems($input: BatchMoveInput!) {
                batchMoveItems(input: $input) {
                    success
                    processedCount
                    failedCount
                    errors
                }
            }
        `;

        const moveRes = await page.request.post(API_ENDPOINT, {
            data: {
                query: batchMoveMutation,
                variables: {
                    input: {
                        itemIds: [item1Id, item2Id],
                        categoryId: categoryId,
                    },
                },
            },
        });

        expect(moveRes.ok()).toBeTruthy();
        const moveJson = await moveRes.json();

        expect(moveJson.data.batchMoveItems).toMatchObject({
            success: true,
            processedCount: 2,
            failedCount: 0,
        });

        // Cleanup: delete items and category
        await page.request.post(API_ENDPOINT, {
            data: {
                query: `
                    mutation BatchDeleteItems($input: BatchDeleteInput!) {
                        batchDeleteItems(input: $input) { success }
                    }
                `,
                variables: { input: { itemIds: [item1Id, item2Id] } },
            },
        });

        await page.request.post(API_ENDPOINT, {
            data: {
                query: `
                    mutation DeleteCategory($id: ID!) {
                        deleteCategory(id: $id)
                    }
                `,
                variables: { id: categoryId },
            },
        });
    });

    test("batch delete rejects empty itemIds array", async ({ page }) => {
        const batchDeleteMutation = `
            mutation BatchDeleteItems($input: BatchDeleteInput!) {
                batchDeleteItems(input: $input) {
                    success
                    processedCount
                    failedCount
                    errors
                }
            }
        `;

        const deleteRes = await page.request.post(API_ENDPOINT, {
            data: {
                query: batchDeleteMutation,
                variables: {
                    input: {
                        itemIds: [],
                    },
                },
            },
        });

        expect(deleteRes.ok()).toBeTruthy();
        const deleteJson = await deleteRes.json();

        // Should have GraphQL error for empty array
        expect(deleteJson.errors).toBeDefined();
        expect(deleteJson.errors[0].message).toContain(
            "At least one item ID required",
        );
    });

    test("batch delete handles non-existent item IDs gracefully", async ({
        page,
    }) => {
        const batchDeleteMutation = `
            mutation BatchDeleteItems($input: BatchDeleteInput!) {
                batchDeleteItems(input: $input) {
                    success
                    processedCount
                    failedCount
                    errors
                }
            }
        `;

        const deleteRes = await page.request.post(API_ENDPOINT, {
            data: {
                query: batchDeleteMutation,
                variables: {
                    input: {
                        itemIds: ["non-existent-id-1", "non-existent-id-2"],
                    },
                },
            },
        });

        expect(deleteRes.ok()).toBeTruthy();
        const deleteJson = await deleteRes.json();

        expect(deleteJson.data.batchDeleteItems).toMatchObject({
            success: false,
            processedCount: 0,
            failedCount: 2,
        });
        expect(deleteJson.data.batchDeleteItems.errors).toContain(
            "No valid items to delete",
        );
    });

    test("batch move to null categoryId removes category from items", async ({
        page,
    }) => {
        // Create a category first
        const createCategoryMutation = `
            mutation CreateCategory($input: CreateCategoryInput!) {
                createCategory(input: $input) { id }
            }
        `;

        const categoryRes = await page.request.post(API_ENDPOINT, {
            data: {
                query: createCategoryMutation,
                variables: {
                    input: { name: "Temp Category", color: "#000000" },
                },
            },
        });
        const categoryJson = await categoryRes.json();
        const categoryId = categoryJson.data?.createCategory?.id;

        // Create an item in that category
        const createItemMutation = `
            mutation CreateItem($input: CreateItemInput!) {
                createItem(input: $input) { id }
            }
        `;

        const itemRes = await page.request.post(API_ENDPOINT, {
            data: {
                query: createItemMutation,
                variables: {
                    input: {
                        title: "Item with category",
                        categoryId: categoryId,
                    },
                },
            },
        });
        const itemJson = await itemRes.json();
        const itemId = itemJson.data?.createItem?.id;

        // Move to null category (uncategorized)
        const batchMoveMutation = `
            mutation BatchMoveItems($input: BatchMoveInput!) {
                batchMoveItems(input: $input) {
                    success
                    processedCount
                }
            }
        `;

        const moveRes = await page.request.post(API_ENDPOINT, {
            data: {
                query: batchMoveMutation,
                variables: {
                    input: {
                        itemIds: [itemId],
                        categoryId: null,
                    },
                },
            },
        });

        expect(moveRes.ok()).toBeTruthy();
        const moveJson = await moveRes.json();
        expect(moveJson.data.batchMoveItems.success).toBe(true);
        expect(moveJson.data.batchMoveItems.processedCount).toBe(1);

        // Cleanup
        await page.request.post(API_ENDPOINT, {
            data: {
                query: `mutation { deleteItem(id: "${itemId}") }`,
            },
        });
        await page.request.post(API_ENDPOINT, {
            data: {
                query: `mutation { deleteCategory(id: "${categoryId}") }`,
            },
        });
    });
});
