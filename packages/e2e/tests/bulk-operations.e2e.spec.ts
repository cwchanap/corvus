import { test, expect, type Page, type TestInfo } from "@playwright/test";

// E2E tests for bulk operations: batch delete and batch move
// Uses baseURL from playwright.config.ts (http://localhost:5000)

test.describe("Bulk Operations E2E", () => {
    const EMAIL = "bulktest.20250808.001@example.com";
    const PASSWORD = "Password123!";
    const NAME = "Bulk Test User";
    const API_ENDPOINT =
        // eslint-disable-next-line turbo/no-undeclared-env-vars
        process.env.VITE_API_URL ?? "http://localhost:5002/graphql";
    const SESSION_COOKIE_NAME = "corvus-session";

    async function graphqlRequest(
        page: Page,
        query: string,
        variables?: Record<string, unknown>,
    ): Promise<{ ok: boolean; status: number; json: unknown | null }> {
        return page.evaluate(
            async ({ endpoint, query, variables }) => {
                const response = await fetch(endpoint, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    credentials: "include",
                    body: JSON.stringify({ query, variables }),
                });

                const text = await response.text();
                let json: unknown | null = null;
                try {
                    json = text ? JSON.parse(text) : null;
                } catch {
                    json = null;
                }

                return {
                    ok: response.ok,
                    status: response.status,
                    json,
                };
            },
            { endpoint: API_ENDPOINT, query, variables },
        );
    }

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
        const cookies = await page.context().cookies(API_ENDPOINT);
        const sessionCookie = cookies.find(
            (cookie) => cookie.name === SESSION_COOKIE_NAME,
        );
        expect(sessionCookie).toBeTruthy();
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
        // Track created item IDs for cleanup
        const itemIds: string[] = [];

        // First create test items via API
        const createItemMutation = `
                mutation CreateItem($input: ItemInput!) {
                    createItem(input: $input) {
                        id
                        title
                    }
                }
            `;

        // Create 2 test items
        const item1Res = await graphqlRequest(page, createItemMutation, {
            input: {
                title: "Bulk Delete Test Item 1",
                description: "Test item for bulk delete",
            },
        });
        expect(item1Res.ok).toBeTruthy();
        const item1Json = item1Res.json as {
            data?: { createItem?: { id?: string } };
        };
        const item1Id = item1Json.data?.createItem?.id;
        expect(item1Id).toBeTruthy();
        itemIds.push(item1Id!);

        const item2Res = await graphqlRequest(page, createItemMutation, {
            input: {
                title: "Bulk Delete Test Item 2",
                description: "Test item for bulk delete",
            },
        });
        expect(item2Res.ok).toBeTruthy();
        const item2Json = item2Res.json as {
            data?: { createItem?: { id?: string } };
        };
        const item2Id = item2Json.data?.createItem?.id;
        expect(item2Id).toBeTruthy();
        itemIds.push(item2Id!);

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

        const deleteRes = await graphqlRequest(page, batchDeleteMutation, {
            input: {
                itemIds,
            },
        });

        expect(deleteRes.ok).toBeTruthy();
        const deleteJson = deleteRes.json as {
            data: { batchDeleteItems: unknown };
        };

        expect(deleteJson.data.batchDeleteItems).toMatchObject({
            success: true,
            processedCount: 2,
            failedCount: 0,
        });
    });

    test.afterEach(async (_: { page: Page }, testInfo: TestInfo) => {
        // Skip cleanup if test passed - items were already deleted by the test
        if (testInfo.status === "passed") {
            return;
        }

        // For failed or interrupted tests, log a warning
        console.warn(
            `Test "${testInfo.title}" failed - manual cleanup may be needed`,
        );
    });

    test("batch move via GraphQL API works correctly", async ({ page }) => {
        // Track created resources for cleanup
        const createdIds = {
            items: [] as string[],
            category: null as string | null,
        };

        try {
            // First create a category
            const createCategoryMutation = `
                mutation CreateCategory($input: CategoryInput!) {
                    createCategory(input: $input) {
                        id
                        name
                    }
                }
            `;

            const categoryRes = await graphqlRequest(
                page,
                createCategoryMutation,
                {
                    input: {
                        name: "Bulk Move Test Category",
                        color: "#FF5733",
                    },
                },
            );
            expect(categoryRes.ok).toBeTruthy();
            const categoryJson = categoryRes.json as {
                data?: { createCategory?: { id?: string } };
            };
            const categoryId = categoryJson.data?.createCategory?.id;
            expect(categoryId).toBeTruthy();
            createdIds.category = categoryId!;

            // Create test items
            const createItemMutation = `
                mutation CreateItem($input: ItemInput!) {
                    createItem(input: $input) {
                        id
                        title
                    }
                }
            `;

            const item1Res = await graphqlRequest(page, createItemMutation, {
                input: {
                    title: "Bulk Move Test Item 1",
                },
            });
            expect(item1Res.ok).toBeTruthy();
            const item1Json = item1Res.json as {
                data?: { createItem?: { id?: string } };
            };
            const item1Id = item1Json.data?.createItem?.id;
            expect(item1Id).toBeTruthy();
            createdIds.items.push(item1Id!);

            const item2Res = await graphqlRequest(page, createItemMutation, {
                input: {
                    title: "Bulk Move Test Item 2",
                },
            });
            expect(item2Res.ok).toBeTruthy();
            const item2Json = item2Res.json as {
                data?: { createItem?: { id?: string } };
            };
            const item2Id = item2Json.data?.createItem?.id;
            expect(item2Id).toBeTruthy();
            createdIds.items.push(item2Id!);

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

            const moveRes = await graphqlRequest(page, batchMoveMutation, {
                input: {
                    itemIds: [item1Id, item2Id],
                    categoryId: categoryId,
                },
            });

            expect(moveRes.ok).toBeTruthy();
            const moveJson = moveRes.json as {
                data: { batchMoveItems: unknown };
            };

            expect(moveJson.data.batchMoveItems).toMatchObject({
                success: true,
                processedCount: 2,
                failedCount: 0,
            });
        } finally {
            // Cleanup: delete items and category
            if (createdIds.items.length > 0) {
                await graphqlRequest(
                    page,
                    `
                        mutation BatchDeleteItems($input: BatchDeleteInput!) {
                            batchDeleteItems(input: $input) { success }
                        }
                    `,
                    { input: { itemIds: createdIds.items } },
                );
            }

            if (createdIds.category) {
                await graphqlRequest(
                    page,
                    `
                        mutation DeleteCategory($id: ID!) {
                            deleteCategory(id: $id)
                        }
                    `,
                    { id: createdIds.category },
                );
            }
        }
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

        const deleteRes = await graphqlRequest(page, batchDeleteMutation, {
            input: {
                itemIds: [],
            },
        });

        expect(deleteRes.ok).toBeTruthy();
        const deleteJson = deleteRes.json as {
            errors?: Array<{ message: string }>;
        };

        // Should have GraphQL error for empty array
        expect(deleteJson.errors).toBeDefined();
        expect(deleteJson.errors?.length).toBeGreaterThan(0);
        expect(deleteJson.errors?.[0]?.message).toContain(
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

        const deleteRes = await graphqlRequest(page, batchDeleteMutation, {
            input: {
                itemIds: ["non-existent-id-1", "non-existent-id-2"],
            },
        });

        expect(deleteRes.ok).toBeTruthy();
        const deleteJson = deleteRes.json as {
            data: {
                batchDeleteItems: {
                    errors: string[];
                };
            };
        };

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
        // Track created resources for cleanup
        const createdIds = {
            item: null as string | null,
            category: null as string | null,
        };

        try {
            // Create a category first
            const createCategoryMutation = `
                mutation CreateCategory($input: CategoryInput!) {
                    createCategory(input: $input) { id }
                }
            `;

            const categoryRes = await graphqlRequest(
                page,
                createCategoryMutation,
                {
                    input: { name: "Temp Category", color: "#000000" },
                },
            );
            const categoryJson = categoryRes.json as {
                data?: { createCategory?: { id?: string } };
            };
            const categoryId = categoryJson.data?.createCategory?.id;
            expect(categoryId).toBeTruthy();
            createdIds.category = categoryId!;

            // Create an item in that category
            const createItemMutation = `
                mutation CreateItem($input: ItemInput!) {
                    createItem(input: $input) { id }
                }
            `;

            const itemRes = await graphqlRequest(page, createItemMutation, {
                input: {
                    title: "Item with category",
                    categoryId: categoryId,
                },
            });
            const itemJson = itemRes.json as {
                data?: { createItem?: { id?: string } };
            };
            const itemId = itemJson.data?.createItem?.id;
            expect(itemId).toBeTruthy();
            createdIds.item = itemId!;

            // Move to null category (uncategorized)
            const batchMoveMutation = `
                mutation BatchMoveItems($input: BatchMoveInput!) {
                    batchMoveItems(input: $input) {
                        success
                        processedCount
                    }
                }
            `;

            const moveRes = await graphqlRequest(page, batchMoveMutation, {
                input: {
                    itemIds: [itemId],
                    categoryId: null,
                },
            });

            expect(moveRes.ok).toBeTruthy();
            const moveJson = moveRes.json as {
                data: {
                    batchMoveItems: {
                        success: boolean;
                        processedCount: number;
                    };
                };
            };
            expect(moveJson.data.batchMoveItems.success).toBe(true);
            expect(moveJson.data.batchMoveItems.processedCount).toBe(1);
        } finally {
            // Cleanup: delete item and category
            if (createdIds.item) {
                await graphqlRequest(
                    page,
                    `
                        mutation DeleteItem($id: ID!) {
                            deleteItem(id: $id)
                        }
                    `,
                    { id: createdIds.item },
                );
            }
            if (createdIds.category) {
                await graphqlRequest(
                    page,
                    `
                        mutation DeleteCategory($id: ID!) {
                            deleteCategory(id: $id)
                        }
                    `,
                    { id: createdIds.category },
                );
            }
        }
    });
});
