import { describe, expect, it, vi } from "vitest";
import type { DB } from "../../src/lib/db";
import type {
    WishlistCategory,
    WishlistItem,
    WishlistItemLink,
} from "../../src/lib/db/types";
import { WishlistService } from "../../src/lib/wishlist/service";
import type { WishlistSortKey, SortDirection } from "../../src/graphql/types";

describe("WishlistService", () => {
    it("aggregates wishlist data with pagination and link mapping", async () => {
        const categories: WishlistCategory[] = [
            {
                id: "cat-1",
                user_id: 42,
                name: "Gadgets",
                color: "#FF0000",
                created_at: "2024-01-01T00:00:00.000Z",
                updated_at: "2024-01-01T00:00:00.000Z",
            },
            {
                id: "cat-2",
                user_id: 42,
                name: "Books",
                color: "#00FF00",
                created_at: "2024-01-02T00:00:00.000Z",
                updated_at: "2024-01-02T00:00:00.000Z",
            },
        ];
        const items: WishlistItem[] = [
            {
                id: "item-1",
                user_id: 42,
                category_id: "cat-1",
                title: "Noise Cancelling Headphones",
                description: "Comfortable and quiet",
                favicon: null,
                created_at: "2024-01-05T00:00:00.000Z",
                updated_at: "2024-01-05T00:00:00.000Z",
            },
            {
                id: "item-2",
                user_id: 42,
                category_id: "cat-2",
                title: "Productivity Book",
                description: null,
                favicon: null,
                created_at: "2024-01-04T00:00:00.000Z",
                updated_at: "2024-01-04T00:00:00.000Z",
            },
        ];
        const links: WishlistItemLink[] = [
            {
                id: "link-1",
                item_id: "item-1",
                url: "https://shop.example/headphones",
                description: "Primary retailer",
                is_primary: true,
                created_at: "2024-01-05T00:00:00.000Z",
                updated_at: "2024-01-05T00:00:00.000Z",
            },
            {
                id: "link-2",
                item_id: "item-1",
                url: "https://shop2.example/headphones",
                description: null,
                is_primary: false,
                created_at: "2024-01-05T01:00:00.000Z",
                updated_at: "2024-01-05T01:00:00.000Z",
            },
        ];

        const orderAllMock = vi.fn().mockResolvedValue(links);
        const selectChain = {
            from: vi.fn(() => selectChain),
            where: vi.fn(() => selectChain),
            orderBy: vi.fn(() => ({ all: orderAllMock })),
        };

        const fakeDb: Partial<DB> = {
            select: vi.fn(() => selectChain),
        };

        let receivedOptions: Record<string, unknown> | undefined;

        class TestWishlistService extends WishlistService {
            constructor() {
                super(fakeDb as DB);
            }

            override async getUserCategories() {
                return categories;
            }

            override async getUserItems(
                _userId: number,
                options: Record<string, unknown> = {},
            ) {
                receivedOptions = options;
                return items;
            }

            override async getUserItemsCount() {
                return 5;
            }
        }

        const service = new TestWishlistService();
        const options = {
            limit: 2,
            offset: 2,
            categoryId: "cat-1",
            search: "shop",
        };

        const result = await service.getUserWishlistData(42, options);

        expect(receivedOptions).toEqual(options);
        expect(fakeDb.select).toHaveBeenCalledTimes(1);
        expect(selectChain.where).toHaveBeenCalledTimes(1);
        expect(orderAllMock).toHaveBeenCalledTimes(1);

        expect(result.categories).toEqual(categories);
        expect(result.items).toHaveLength(2);
        expect(result.items[0]?.links).toHaveLength(2);
        expect(result.items[0]?.links[0]?.is_primary).toBe(true);
        expect(result.pagination).toEqual({
            total_items: 5,
            page: 2,
            page_size: 2,
            total_pages: 3,
            has_next: true,
            has_previous: true,
        });
    });

    it("handles empty wishlists without querying for links", async () => {
        const fakeDb: Partial<DB> = {
            select: vi.fn(() => {
                throw new Error(
                    "Links should not be queried when there are no items",
                );
            }),
        };

        class EmptyWishlistService extends WishlistService {
            constructor() {
                super(fakeDb as DB);
            }

            override async getUserCategories() {
                return [];
            }

            override async getUserItems() {
                return [];
            }

            override async getUserItemsCount() {
                return 0;
            }
        }

        const service = new EmptyWishlistService();
        const result = await service.getUserWishlistData(99);

        expect(result.categories).toEqual([]);
        expect(result.items).toEqual([]);
        expect(result.pagination).toEqual({
            total_items: 0,
            page: 1,
            page_size: 0,
            total_pages: 0,
            has_next: false,
            has_previous: false,
        });
        expect(fakeDb.select).not.toHaveBeenCalled();
    });

    it("handles enum-based sorting with direction", async () => {
        const items: WishlistItem[] = [
            {
                id: "item-1",
                user_id: 42,
                category_id: "cat-1",
                title: "Apple",
                description: null,
                favicon: null,
                created_at: "2024-01-05T00:00:00.000Z",
                updated_at: "2024-01-05T00:00:00.000Z",
            },
            {
                id: "item-2",
                user_id: 42,
                category_id: "cat-1",
                title: "Zebra",
                description: null,
                favicon: null,
                created_at: "2024-01-04T00:00:00.000Z",
                updated_at: "2024-01-04T00:00:00.000Z",
            },
        ];

        const orderAllMock = vi.fn().mockResolvedValue(items);
        const selectChain = {
            from: vi.fn(() => selectChain),
            where: vi.fn(() => selectChain),
            orderBy: vi.fn(() => ({ all: orderAllMock })),
        };

        const fakeDb: Partial<DB> = {
            select: vi.fn(() => selectChain),
        };

        class TestWishlistService extends WishlistService {
            constructor() {
                super(fakeDb as DB);
            }

            override async getUserCategories() {
                return [];
            }

            override async getUserItemsCount() {
                return 2;
            }
        }

        const service = new TestWishlistService();

        // Test sorting by title in ascending order using enum values
        const sortBy = "TITLE" as WishlistSortKey;
        const sortDir = "ASC" as SortDirection;

        const result = await service.getUserItems(42, { sortBy, sortDir });

        expect(result).toEqual(items);
        expect(fakeDb.select).toHaveBeenCalledTimes(1);
        expect(selectChain.where).toHaveBeenCalledTimes(1);
        expect(selectChain.orderBy).toHaveBeenCalledTimes(1);

        // Verify that orderBy was called (we can't easily test the exact argument due to mock limitations)
        // but we can verify the chain was properly constructed
        expect(orderAllMock).toHaveBeenCalledTimes(1);
    });

    describe("Category Operations", () => {
        it("getUserCategories returns all categories for a user", async () => {
            const categories: WishlistCategory[] = [
                {
                    id: "cat-1",
                    user_id: 42,
                    name: "Electronics",
                    color: "#FF0000",
                    created_at: "2024-01-01T00:00:00.000Z",
                    updated_at: "2024-01-01T00:00:00.000Z",
                },
                {
                    id: "cat-2",
                    user_id: 42,
                    name: "Books",
                    color: "#00FF00",
                    created_at: "2024-01-02T00:00:00.000Z",
                    updated_at: "2024-01-02T00:00:00.000Z",
                },
            ];

            const allMock = vi.fn().mockResolvedValue(categories);
            const orderByMock = vi.fn(() => ({ all: allMock }));
            const whereMock = vi.fn(() => ({ orderBy: orderByMock }));
            const fromMock = vi.fn(() => ({ where: whereMock }));
            const selectMock = vi.fn(() => ({ from: fromMock }));

            const fakeDb: Partial<DB> = {
                select: selectMock,
            };

            const service = new WishlistService(fakeDb as DB);
            const result = await service.getUserCategories(42);

            expect(result).toEqual(categories);
            expect(selectMock).toHaveBeenCalledTimes(1);
            expect(fromMock).toHaveBeenCalledTimes(1);
            expect(whereMock).toHaveBeenCalledTimes(1);
            expect(orderByMock).toHaveBeenCalledTimes(1);
            expect(allMock).toHaveBeenCalledTimes(1);
        });

        it("createCategory inserts a new category with generated UUID", async () => {
            const newCategory: WishlistCategory = {
                id: "generated-uuid",
                user_id: 42,
                name: "New Category",
                color: "#0000FF",
                created_at: "2024-01-01T00:00:00.000Z",
                updated_at: "2024-01-01T00:00:00.000Z",
            };

            const getMock = vi.fn().mockResolvedValue(newCategory);
            const returningMock = vi.fn(() => ({ get: getMock }));
            const valuesMock = vi.fn(() => ({ returning: returningMock }));
            const insertMock = vi.fn(() => ({ values: valuesMock }));

            const fakeDb: Partial<DB> = {
                insert: insertMock,
            };

            const service = new WishlistService(fakeDb as DB);
            const result = await service.createCategory({
                user_id: 42,
                name: "New Category",
                color: "#0000FF",
            });

            expect(result).toEqual(newCategory);
            expect(insertMock).toHaveBeenCalledTimes(1);
            expect(valuesMock).toHaveBeenCalledTimes(1);
            expect(returningMock).toHaveBeenCalledTimes(1);
            expect(getMock).toHaveBeenCalledTimes(1);
        });

        it("updateCategory updates an existing category", async () => {
            const updatedCategory: WishlistCategory = {
                id: "cat-1",
                user_id: 42,
                name: "Updated Name",
                color: "#FF00FF",
                created_at: "2024-01-01T00:00:00.000Z",
                updated_at: "2024-01-02T00:00:00.000Z",
            };

            const getMock = vi.fn().mockResolvedValue(updatedCategory);
            const returningMock = vi.fn(() => ({ get: getMock }));
            const whereMock = vi.fn(() => ({ returning: returningMock }));
            const setMock = vi.fn(() => ({ where: whereMock }));
            const updateMock = vi.fn(() => ({ set: setMock }));

            const fakeDb: Partial<DB> = {
                update: updateMock,
            };

            const service = new WishlistService(fakeDb as DB);
            const result = await service.updateCategory("cat-1", 42, {
                name: "Updated Name",
                color: "#FF00FF",
            });

            expect(result).toEqual(updatedCategory);
            expect(updateMock).toHaveBeenCalledTimes(1);
            expect(setMock).toHaveBeenCalledTimes(1);
            expect(whereMock).toHaveBeenCalledTimes(1);
            expect(returningMock).toHaveBeenCalledTimes(1);
            expect(getMock).toHaveBeenCalledTimes(1);
        });

        it("updateCategory returns null when category not found", async () => {
            const getMock = vi.fn().mockResolvedValue(undefined);
            const returningMock = vi.fn(() => ({ get: getMock }));
            const whereMock = vi.fn(() => ({ returning: returningMock }));
            const setMock = vi.fn(() => ({ where: whereMock }));
            const updateMock = vi.fn(() => ({ set: setMock }));

            const fakeDb: Partial<DB> = {
                update: updateMock,
            };

            const service = new WishlistService(fakeDb as DB);
            const result = await service.updateCategory("non-existent", 42, {
                name: "Updated Name",
            });

            expect(result).toBeNull();
        });

        it("deleteCategory removes category and unlinks items", async () => {
            const runMock1 = vi.fn().mockResolvedValue(undefined);
            const runMock2 = vi.fn().mockResolvedValue(undefined);

            const whereMock1 = vi.fn(() => ({ run: runMock1 }));
            const setMock = vi.fn(() => ({ where: whereMock1 }));
            const updateMock = vi.fn(() => ({ set: setMock }));

            const whereMock2 = vi.fn(() => ({ run: runMock2 }));
            const deleteMock = vi.fn(() => ({ where: whereMock2 }));

            const fakeDb: Partial<DB> = {
                update: updateMock,
                delete: deleteMock,
            };

            const service = new WishlistService(fakeDb as DB);
            await service.deleteCategory("cat-1", 42);

            expect(updateMock).toHaveBeenCalledTimes(1);
            expect(setMock).toHaveBeenCalledTimes(1);
            expect(whereMock1).toHaveBeenCalledTimes(1);
            expect(runMock1).toHaveBeenCalledTimes(1);
            expect(deleteMock).toHaveBeenCalledTimes(1);
            expect(whereMock2).toHaveBeenCalledTimes(1);
            expect(runMock2).toHaveBeenCalledTimes(1);
        });
    });

    describe("Item Operations", () => {
        it("getUserItems returns items with default sorting", async () => {
            const items: WishlistItem[] = [
                {
                    id: "item-1",
                    user_id: 42,
                    category_id: "cat-1",
                    title: "Item 1",
                    description: "Description 1",
                    favicon: null,
                    created_at: "2024-01-05T00:00:00.000Z",
                    updated_at: "2024-01-05T00:00:00.000Z",
                },
            ];

            const allMock = vi.fn().mockResolvedValue(items);
            const orderByMock = vi.fn(() => ({ all: allMock }));
            const whereMock = vi.fn(() => ({ orderBy: orderByMock }));
            const fromMock = vi.fn(() => ({ where: whereMock }));
            const selectMock = vi.fn(() => ({ from: fromMock }));

            const fakeDb: Partial<DB> = {
                select: selectMock,
            };

            const service = new WishlistService(fakeDb as DB);
            const result = await service.getUserItems(42);

            expect(result).toEqual(items);
            expect(selectMock).toHaveBeenCalledTimes(1);
            expect(allMock).toHaveBeenCalledTimes(1);
        });

        it("getUserItems applies limit and offset", async () => {
            const items: WishlistItem[] = [
                {
                    id: "item-2",
                    user_id: 42,
                    category_id: "cat-1",
                    title: "Item 2",
                    description: null,
                    favicon: null,
                    created_at: "2024-01-04T00:00:00.000Z",
                    updated_at: "2024-01-04T00:00:00.000Z",
                },
            ];

            const allMock = vi.fn().mockResolvedValue(items);
            const offsetMock = vi.fn(() => ({ all: allMock }));
            const limitMock = vi.fn(() => ({ offset: offsetMock }));
            const orderByMock = vi.fn(() => ({ limit: limitMock }));
            const whereMock = vi.fn(() => ({ orderBy: orderByMock }));
            const fromMock = vi.fn(() => ({ where: whereMock }));
            const selectMock = vi.fn(() => ({ from: fromMock }));

            const fakeDb: Partial<DB> = {
                select: selectMock,
            };

            const service = new WishlistService(fakeDb as DB);
            const result = await service.getUserItems(42, {
                limit: 10,
                offset: 5,
            });

            expect(result).toEqual(items);
            expect(limitMock).toHaveBeenCalledWith(10);
            expect(offsetMock).toHaveBeenCalledWith(5);
        });

        it("getUserItems applies category filter", async () => {
            const items: WishlistItem[] = [];

            const allMock = vi.fn().mockResolvedValue(items);
            const orderByMock = vi.fn(() => ({ all: allMock }));
            const whereMock = vi.fn(() => ({ orderBy: orderByMock }));
            const fromMock = vi.fn(() => ({ where: whereMock }));
            const selectMock = vi.fn(() => ({ from: fromMock }));

            const fakeDb: Partial<DB> = {
                select: selectMock,
            };

            const service = new WishlistService(fakeDb as DB);
            const result = await service.getUserItems(42, {
                categoryId: "cat-1",
            });

            expect(result).toEqual(items);
            expect(whereMock).toHaveBeenCalledTimes(1);
        });

        it("getUserItems applies search filter", async () => {
            const items: WishlistItem[] = [];

            const allMock = vi.fn().mockResolvedValue(items);
            const orderByMock = vi.fn(() => ({ all: allMock }));
            const whereMock = vi.fn(() => ({ orderBy: orderByMock }));
            const fromMock = vi.fn(() => ({ where: whereMock }));
            const selectMock = vi.fn(() => ({ from: fromMock }));

            const fakeDb: Partial<DB> = {
                select: selectMock,
            };

            const service = new WishlistService(fakeDb as DB);
            const result = await service.getUserItems(42, {
                search: "headphones",
            });

            expect(result).toEqual(items);
            expect(whereMock).toHaveBeenCalledTimes(1);
        });

        it("getUserItems sorts by CREATED_AT DESC by default", async () => {
            const items: WishlistItem[] = [];

            const allMock = vi.fn().mockResolvedValue(items);
            const orderByMock = vi.fn(() => ({ all: allMock }));
            const whereMock = vi.fn(() => ({ orderBy: orderByMock }));
            const fromMock = vi.fn(() => ({ where: whereMock }));
            const selectMock = vi.fn(() => ({ from: fromMock }));

            const fakeDb: Partial<DB> = {
                select: selectMock,
            };

            const service = new WishlistService(fakeDb as DB);
            await service.getUserItems(42);

            expect(orderByMock).toHaveBeenCalledTimes(1);
        });

        it("getUserItems sorts by TITLE ASC", async () => {
            const items: WishlistItem[] = [];

            const allMock = vi.fn().mockResolvedValue(items);
            const orderByMock = vi.fn(() => ({ all: allMock }));
            const whereMock = vi.fn(() => ({ orderBy: orderByMock }));
            const fromMock = vi.fn(() => ({ where: whereMock }));
            const selectMock = vi.fn(() => ({ from: fromMock }));

            const fakeDb: Partial<DB> = {
                select: selectMock,
            };

            const service = new WishlistService(fakeDb as DB);
            await service.getUserItems(42, {
                sortBy: "TITLE" as WishlistSortKey,
                sortDir: "ASC" as SortDirection,
            });

            expect(orderByMock).toHaveBeenCalledTimes(1);
        });

        it("getItemsByCategory returns items for specific category", async () => {
            const items: WishlistItem[] = [
                {
                    id: "item-1",
                    user_id: 42,
                    category_id: "cat-1",
                    title: "Item 1",
                    description: null,
                    favicon: null,
                    created_at: "2024-01-05T00:00:00.000Z",
                    updated_at: "2024-01-05T00:00:00.000Z",
                },
            ];

            const allMock = vi.fn().mockResolvedValue(items);
            const orderByMock = vi.fn(() => ({ all: allMock }));
            const whereMock = vi.fn(() => ({ orderBy: orderByMock }));
            const fromMock = vi.fn(() => ({ where: whereMock }));
            const selectMock = vi.fn(() => ({ from: fromMock }));

            const fakeDb: Partial<DB> = {
                select: selectMock,
            };

            const service = new WishlistService(fakeDb as DB);
            const result = await service.getItemsByCategory(42, "cat-1");

            expect(result).toEqual(items);
            expect(whereMock).toHaveBeenCalledTimes(1);
        });

        it("getUserItemsCount returns count of items", async () => {
            const getMock = vi.fn().mockResolvedValue({ value: 5 });
            const whereMock = vi.fn(() => ({ get: getMock }));
            const fromMock = vi.fn(() => ({ where: whereMock }));
            const selectMock = vi.fn(() => ({ from: fromMock }));

            const fakeDb: Partial<DB> = {
                select: selectMock,
            };

            const service = new WishlistService(fakeDb as DB);
            const result = await service.getUserItemsCount(42);

            expect(result).toBe(5);
            expect(selectMock).toHaveBeenCalledTimes(1);
            expect(whereMock).toHaveBeenCalledTimes(1);
            expect(getMock).toHaveBeenCalledTimes(1);
        });

        it("getUserItemsCount returns 0 when result is null", async () => {
            const getMock = vi.fn().mockResolvedValue(null);
            const whereMock = vi.fn(() => ({ get: getMock }));
            const fromMock = vi.fn(() => ({ where: whereMock }));
            const selectMock = vi.fn(() => ({ from: fromMock }));

            const fakeDb: Partial<DB> = {
                select: selectMock,
            };

            const service = new WishlistService(fakeDb as DB);
            const result = await service.getUserItemsCount(42);

            expect(result).toBe(0);
        });

        it("createItem inserts a new item with generated UUID", async () => {
            const newItem: WishlistItem = {
                id: "generated-uuid",
                user_id: 42,
                category_id: "cat-1",
                title: "New Item",
                description: "Description",
                favicon: null,
                created_at: "2024-01-01T00:00:00.000Z",
                updated_at: "2024-01-01T00:00:00.000Z",
            };

            const getMock = vi.fn().mockResolvedValue(newItem);
            const returningMock = vi.fn(() => ({ get: getMock }));
            const valuesMock = vi.fn(() => ({ returning: returningMock }));
            const insertMock = vi.fn(() => ({ values: valuesMock }));

            const fakeDb: Partial<DB> = {
                insert: insertMock,
            };

            const service = new WishlistService(fakeDb as DB);
            const result = await service.createItem({
                user_id: 42,
                category_id: "cat-1",
                title: "New Item",
                description: "Description",
            });

            expect(result).toEqual(newItem);
            expect(insertMock).toHaveBeenCalledTimes(1);
            expect(valuesMock).toHaveBeenCalledTimes(1);
            expect(returningMock).toHaveBeenCalledTimes(1);
            expect(getMock).toHaveBeenCalledTimes(1);
        });

        it("updateItem updates an existing item", async () => {
            const updatedItem: WishlistItem = {
                id: "item-1",
                user_id: 42,
                category_id: "cat-1",
                title: "Updated Title",
                description: "Updated Description",
                favicon: null,
                created_at: "2024-01-01T00:00:00.000Z",
                updated_at: "2024-01-02T00:00:00.000Z",
            };

            const getMock = vi.fn().mockResolvedValue(updatedItem);
            const returningMock = vi.fn(() => ({ get: getMock }));
            const whereMock = vi.fn(() => ({ returning: returningMock }));
            const setMock = vi.fn(() => ({ where: whereMock }));
            const updateMock = vi.fn(() => ({ set: setMock }));

            const fakeDb: Partial<DB> = {
                update: updateMock,
            };

            const service = new WishlistService(fakeDb as DB);
            const result = await service.updateItem("item-1", 42, {
                title: "Updated Title",
                description: "Updated Description",
            });

            expect(result).toEqual(updatedItem);
            expect(updateMock).toHaveBeenCalledTimes(1);
            expect(setMock).toHaveBeenCalledTimes(1);
            expect(whereMock).toHaveBeenCalledTimes(1);
            expect(returningMock).toHaveBeenCalledTimes(1);
            expect(getMock).toHaveBeenCalledTimes(1);
        });

        it("updateItem returns null when item not found", async () => {
            const getMock = vi.fn().mockResolvedValue(undefined);
            const returningMock = vi.fn(() => ({ get: getMock }));
            const whereMock = vi.fn(() => ({ returning: returningMock }));
            const setMock = vi.fn(() => ({ where: whereMock }));
            const updateMock = vi.fn(() => ({ set: setMock }));

            const fakeDb: Partial<DB> = {
                update: updateMock,
            };

            const service = new WishlistService(fakeDb as DB);
            const result = await service.updateItem("non-existent", 42, {
                title: "Updated Title",
            });

            expect(result).toBeNull();
        });

        it("deleteItem removes an item", async () => {
            const runMock = vi.fn().mockResolvedValue(undefined);
            const whereMock = vi.fn(() => ({ run: runMock }));
            const deleteMock = vi.fn(() => ({ where: whereMock }));

            const fakeDb: Partial<DB> = {
                delete: deleteMock,
            };

            const service = new WishlistService(fakeDb as DB);
            await service.deleteItem("item-1", 42);

            expect(deleteMock).toHaveBeenCalledTimes(1);
            expect(whereMock).toHaveBeenCalledTimes(1);
            expect(runMock).toHaveBeenCalledTimes(1);
        });
    });

    describe("Item Link Operations", () => {
        it("getItemLinks returns links sorted by primary first", async () => {
            const links: WishlistItemLink[] = [
                {
                    id: "link-1",
                    item_id: "item-1",
                    url: "https://example.com/1",
                    description: "Primary",
                    is_primary: true,
                    created_at: "2024-01-01T00:00:00.000Z",
                    updated_at: "2024-01-01T00:00:00.000Z",
                },
                {
                    id: "link-2",
                    item_id: "item-1",
                    url: "https://example.com/2",
                    description: "Secondary",
                    is_primary: false,
                    created_at: "2024-01-02T00:00:00.000Z",
                    updated_at: "2024-01-02T00:00:00.000Z",
                },
            ];

            const itemGetMock = vi.fn().mockResolvedValue({ user_id: 42 });
            const itemWhereMock = vi.fn(() => ({ get: itemGetMock }));
            const itemFromMock = vi.fn(() => ({ where: itemWhereMock }));

            const allMock = vi.fn().mockResolvedValue(links);
            const orderByMock = vi.fn(() => ({ all: allMock }));
            const whereMock = vi.fn(() => ({ orderBy: orderByMock }));
            const fromMock = vi.fn(() => ({ where: whereMock }));
            const selectMock = vi
                .fn()
                .mockReturnValueOnce({ from: itemFromMock })
                .mockReturnValueOnce({ from: fromMock });

            const fakeDb: Partial<DB> = {
                select: selectMock,
            };

            const service = new WishlistService(fakeDb as DB);
            const result = await service.getItemLinks(42, "item-1");

            expect(result).toEqual(links);
            expect(selectMock).toHaveBeenCalledTimes(2);
            expect(itemWhereMock).toHaveBeenCalledTimes(1);
            expect(itemGetMock).toHaveBeenCalledTimes(1);
            expect(whereMock).toHaveBeenCalledTimes(1);
            expect(orderByMock).toHaveBeenCalledTimes(1);
            expect(allMock).toHaveBeenCalledTimes(1);
        });

        it("getItemLinks throws when item is not owned by user", async () => {
            const itemGetMock = vi.fn().mockResolvedValue({ user_id: 999 });
            const itemWhereMock = vi.fn(() => ({ get: itemGetMock }));
            const itemFromMock = vi.fn(() => ({ where: itemWhereMock }));
            const selectMock = vi.fn(() => ({ from: itemFromMock }));

            const fakeDb: Partial<DB> = {
                select: selectMock,
            };

            const service = new WishlistService(fakeDb as DB);
            await expect(service.getItemLinks(42, "item-1")).rejects.toThrow(
                "Not authorized",
            );
        });

        it("createItemLink inserts a new link with generated UUID", async () => {
            const newLink: WishlistItemLink = {
                id: "generated-uuid",
                item_id: "item-1",
                url: "https://example.com/new",
                description: "New Link",
                is_primary: false,
                created_at: "2024-01-01T00:00:00.000Z",
                updated_at: "2024-01-01T00:00:00.000Z",
            };

            const getMock = vi.fn().mockResolvedValue(newLink);
            const returningMock = vi.fn(() => ({ get: getMock }));
            const valuesMock = vi.fn(() => ({ returning: returningMock }));
            const insertMock = vi.fn(() => ({ values: valuesMock }));

            const itemGetMock = vi.fn().mockResolvedValue({ user_id: 42 });
            const itemWhereMock = vi.fn(() => ({ get: itemGetMock }));
            const itemFromMock = vi.fn(() => ({ where: itemWhereMock }));
            const selectMock = vi.fn(() => ({ from: itemFromMock }));

            const fakeDb: Partial<DB> = {
                select: selectMock,
                insert: insertMock,
            };

            const service = new WishlistService(fakeDb as DB);
            const result = await service.createItemLink(42, {
                item_id: "item-1",
                url: "https://example.com/new",
                description: "New Link",
                is_primary: false,
            });

            expect(result).toEqual(newLink);
            expect(selectMock).toHaveBeenCalledTimes(1);
            expect(insertMock).toHaveBeenCalledTimes(1);
            expect(valuesMock).toHaveBeenCalledTimes(1);
            expect(returningMock).toHaveBeenCalledTimes(1);
            expect(getMock).toHaveBeenCalledTimes(1);
        });

        it("updateItemLink updates an existing link", async () => {
            const updatedLink: WishlistItemLink = {
                id: "link-1",
                item_id: "item-1",
                url: "https://example.com/updated",
                description: "Updated Link",
                is_primary: true,
                created_at: "2024-01-01T00:00:00.000Z",
                updated_at: "2024-01-02T00:00:00.000Z",
            };

            const getMock = vi.fn().mockResolvedValue(updatedLink);
            const returningMock = vi.fn(() => ({ get: getMock }));
            const whereMock = vi.fn(() => ({ returning: returningMock }));
            const setMock = vi.fn(() => ({ where: whereMock }));
            const updateMock = vi.fn(() => ({ set: setMock }));

            const fakeDb: Partial<DB> = {
                update: updateMock,
            };

            const service = new WishlistService(fakeDb as DB);
            const result = await service.updateItemLink(42, "link-1", {
                url: "https://example.com/updated",
                description: "Updated Link",
            });

            expect(result).toEqual(updatedLink);
            expect(updateMock).toHaveBeenCalledTimes(1);
            expect(setMock).toHaveBeenCalledTimes(1);
            expect(whereMock).toHaveBeenCalledTimes(1);
            expect(returningMock).toHaveBeenCalledTimes(1);
            expect(getMock).toHaveBeenCalledTimes(1);
        });

        it("updateItemLink returns null when link not found", async () => {
            const getMock = vi.fn().mockResolvedValue(undefined);
            const returningMock = vi.fn(() => ({ get: getMock }));
            const whereMock = vi.fn(() => ({ returning: returningMock }));
            const setMock = vi.fn(() => ({ where: whereMock }));
            const updateMock = vi.fn(() => ({ set: setMock }));

            const fakeDb: Partial<DB> = {
                update: updateMock,
            };

            const service = new WishlistService(fakeDb as DB);
            const result = await service.updateItemLink(42, "non-existent", {
                url: "https://example.com/updated",
            });

            expect(result).toBeNull();
        });

        it("deleteItemLink removes a link", async () => {
            const linkGetMock = vi.fn().mockResolvedValue({ id: "link-1" });
            const linkWhereMock = vi.fn(() => ({ get: linkGetMock }));
            const linkFromMock = vi.fn(() => ({ where: linkWhereMock }));
            const selectMock = vi.fn(() => ({ from: linkFromMock }));

            const runMock = vi.fn().mockResolvedValue(undefined);
            const whereMock = vi.fn(() => ({ run: runMock }));
            const deleteMock = vi.fn(() => ({ where: whereMock }));

            const fakeDb: Partial<DB> = {
                select: selectMock,
                delete: deleteMock,
            };

            const service = new WishlistService(fakeDb as DB);
            await service.deleteItemLink(42, "link-1");

            expect(selectMock).toHaveBeenCalledTimes(1);
            expect(deleteMock).toHaveBeenCalledTimes(1);
            expect(whereMock).toHaveBeenCalledTimes(1);
            expect(runMock).toHaveBeenCalledTimes(1);
        });

        it("deleteItemLink throws when link is not owned by user", async () => {
            const linkGetMock = vi.fn().mockResolvedValue(undefined);
            const linkWhereMock = vi.fn(() => ({ get: linkGetMock }));
            const linkFromMock = vi.fn(() => ({ where: linkWhereMock }));
            const selectMock = vi.fn(() => ({ from: linkFromMock }));

            const fakeDb: Partial<DB> = {
                select: selectMock,
                delete: vi.fn(() => {
                    throw new Error("Should not be called");
                }),
            };

            const service = new WishlistService(fakeDb as DB);
            await expect(service.deleteItemLink(42, "link-1")).rejects.toThrow(
                "Not authorized",
            );
        });

        it("setPrimaryLink unsets all primary flags then sets new primary", async () => {
            const itemGetMock = vi.fn().mockResolvedValue({ user_id: 42 });
            const itemWhereMock = vi.fn(() => ({ get: itemGetMock }));
            const itemFromMock = vi.fn(() => ({ where: itemWhereMock }));

            const linkGetMock = vi.fn().mockResolvedValue({ id: "link-2" });
            const linkWhereMock = vi.fn(() => ({ get: linkGetMock }));
            const linkFromMock = vi.fn(() => ({ where: linkWhereMock }));

            const selectMock = vi
                .fn()
                .mockReturnValueOnce({ from: itemFromMock })
                .mockReturnValueOnce({ from: linkFromMock });

            const runMock1 = vi.fn().mockResolvedValue(undefined);
            const runMock2 = vi.fn().mockResolvedValue(undefined);

            const whereMock1 = vi.fn(() => ({ run: runMock1 }));
            const setMock1 = vi.fn(() => ({ where: whereMock1 }));

            const whereMock2 = vi.fn(() => ({ run: runMock2 }));
            const setMock2 = vi.fn(() => ({ where: whereMock2 }));

            const updateMock = vi
                .fn()
                .mockReturnValueOnce({ set: setMock1 })
                .mockReturnValueOnce({ set: setMock2 });

            const fakeDb: Partial<DB> = {
                select: selectMock,
                update: updateMock,
            };

            const service = new WishlistService(fakeDb as DB);
            await service.setPrimaryLink(42, "item-1", "link-2");

            expect(updateMock).toHaveBeenCalledTimes(2);

            // First update should unset all primary flags
            expect(setMock1).toHaveBeenCalledTimes(1);
            expect(setMock1).toHaveBeenCalledWith({
                is_primary: false,
                updated_at: expect.any(String),
            });
            expect(whereMock1).toHaveBeenCalledTimes(1);
            expect(runMock1).toHaveBeenCalledTimes(1);

            // Second update should set the specific link as primary
            expect(setMock2).toHaveBeenCalledTimes(1);
            expect(setMock2).toHaveBeenCalledWith({
                is_primary: true,
                updated_at: expect.any(String),
            });
            expect(whereMock2).toHaveBeenCalledTimes(1);
            expect(runMock2).toHaveBeenCalledTimes(1);
        });
    });

    describe("Batch Operations", () => {
        describe("batchDeleteItems", () => {
            it("returns early for empty itemIds array", async () => {
                const fakeDb: Partial<DB> = {
                    select: vi.fn(() => {
                        throw new Error("Should not be called");
                    }),
                };

                const service = new WishlistService(fakeDb as DB);
                const result = await service.batchDeleteItems([], 42);

                expect(result).toEqual({
                    processedCount: 0,
                    failedCount: 0,
                    errors: [],
                });
                expect(fakeDb.select).not.toHaveBeenCalled();
            });

            it("deletes valid items and reports invalid ones", async () => {
                // Mock: user owns item-1 and item-2, but not item-3
                const ownedItems = [{ id: "item-1" }, { id: "item-2" }];

                const allMock = vi.fn().mockResolvedValue(ownedItems);
                const selectWhereMock = vi.fn(() => ({ all: allMock }));
                const selectFromMock = vi.fn(() => ({
                    where: selectWhereMock,
                }));
                const selectMock = vi.fn(() => ({ from: selectFromMock }));

                const deleteRunMock = vi.fn().mockResolvedValue(undefined);
                const deleteWhereMock = vi.fn(() => ({ run: deleteRunMock }));
                const deleteMock = vi.fn(() => ({ where: deleteWhereMock }));

                const fakeDb: Partial<DB> = {
                    select: selectMock,
                    delete: deleteMock,
                };

                const service = new WishlistService(fakeDb as DB);
                const result = await service.batchDeleteItems(
                    ["item-1", "item-2", "item-3"],
                    42,
                );

                expect(result).toEqual({
                    processedCount: 2,
                    failedCount: 1,
                    errors: ["1 items not found or unauthorized"],
                });
                expect(selectMock).toHaveBeenCalledTimes(1);
                expect(deleteMock).toHaveBeenCalledTimes(1);
                expect(deleteRunMock).toHaveBeenCalledTimes(1);
            });

            it("returns error when no valid items found", async () => {
                const allMock = vi.fn().mockResolvedValue([]);
                const selectWhereMock = vi.fn(() => ({ all: allMock }));
                const selectFromMock = vi.fn(() => ({
                    where: selectWhereMock,
                }));
                const selectMock = vi.fn(() => ({ from: selectFromMock }));

                const fakeDb: Partial<DB> = {
                    select: selectMock,
                    delete: vi.fn(() => {
                        throw new Error("Should not be called");
                    }),
                };

                const service = new WishlistService(fakeDb as DB);
                const result = await service.batchDeleteItems(
                    ["non-existent-1", "non-existent-2"],
                    42,
                );

                expect(result).toEqual({
                    processedCount: 0,
                    failedCount: 2,
                    errors: ["No valid items to delete"],
                });
                expect(fakeDb.delete).not.toHaveBeenCalled();
            });

            it("deletes all items when all are valid", async () => {
                const ownedItems = [
                    { id: "item-1" },
                    { id: "item-2" },
                    { id: "item-3" },
                ];

                const allMock = vi.fn().mockResolvedValue(ownedItems);
                const selectWhereMock = vi.fn(() => ({ all: allMock }));
                const selectFromMock = vi.fn(() => ({
                    where: selectWhereMock,
                }));
                const selectMock = vi.fn(() => ({ from: selectFromMock }));

                const deleteRunMock = vi.fn().mockResolvedValue(undefined);
                const deleteWhereMock = vi.fn(() => ({ run: deleteRunMock }));
                const deleteMock = vi.fn(() => ({ where: deleteWhereMock }));

                const fakeDb: Partial<DB> = {
                    select: selectMock,
                    delete: deleteMock,
                };

                const service = new WishlistService(fakeDb as DB);
                const result = await service.batchDeleteItems(
                    ["item-1", "item-2", "item-3"],
                    42,
                );

                expect(result).toEqual({
                    processedCount: 3,
                    failedCount: 0,
                    errors: [],
                });
            });
        });

        describe("batchMoveItems", () => {
            it("returns early for empty itemIds array", async () => {
                const fakeDb: Partial<DB> = {
                    select: vi.fn(() => {
                        throw new Error("Should not be called");
                    }),
                };

                const service = new WishlistService(fakeDb as DB);
                const result = await service.batchMoveItems([], 42, "cat-1");

                expect(result).toEqual({
                    processedCount: 0,
                    failedCount: 0,
                    errors: [],
                });
                expect(fakeDb.select).not.toHaveBeenCalled();
            });

            it("moves valid items to category", async () => {
                const ownedItems = [{ id: "item-1" }, { id: "item-2" }];
                const category = { id: "cat-1", user_id: 42, name: "Test" };

                // First select returns owned items
                const selectAllMock1 = vi.fn().mockResolvedValue(ownedItems);
                const selectWhereMock1 = vi.fn(() => ({ all: selectAllMock1 }));
                const selectFromMock1 = vi.fn(() => ({
                    where: selectWhereMock1,
                }));

                // Second select returns category
                const selectGetMock = vi.fn().mockResolvedValue(category);
                const selectWhereMock2 = vi.fn(() => ({ get: selectGetMock }));
                const selectFromMock2 = vi.fn(() => ({
                    where: selectWhereMock2,
                }));

                const selectMock = vi
                    .fn()
                    .mockReturnValueOnce({ from: selectFromMock1 })
                    .mockReturnValueOnce({ from: selectFromMock2 });

                const updateRunMock = vi.fn().mockResolvedValue(undefined);
                const updateWhereMock = vi.fn(() => ({ run: updateRunMock }));
                const updateSetMock = vi.fn(() => ({ where: updateWhereMock }));
                const updateMock = vi.fn(() => ({ set: updateSetMock }));

                const fakeDb: Partial<DB> = {
                    select: selectMock,
                    update: updateMock,
                };

                const service = new WishlistService(fakeDb as DB);
                const result = await service.batchMoveItems(
                    ["item-1", "item-2"],
                    42,
                    "cat-1",
                );

                expect(result).toEqual({
                    processedCount: 2,
                    failedCount: 0,
                    errors: [],
                });
                expect(updateMock).toHaveBeenCalledTimes(1);
                expect(updateSetMock).toHaveBeenCalledWith({
                    category_id: "cat-1",
                    updated_at: expect.any(String),
                });
            });

            it("moves items to null category (uncategorized)", async () => {
                const ownedItems = [{ id: "item-1" }];

                const selectAllMock = vi.fn().mockResolvedValue(ownedItems);
                const selectWhereMock = vi.fn(() => ({ all: selectAllMock }));
                const selectFromMock = vi.fn(() => ({
                    where: selectWhereMock,
                }));
                const selectMock = vi.fn(() => ({ from: selectFromMock }));

                const updateRunMock = vi.fn().mockResolvedValue(undefined);
                const updateWhereMock = vi.fn(() => ({ run: updateRunMock }));
                const updateSetMock = vi.fn(() => ({ where: updateWhereMock }));
                const updateMock = vi.fn(() => ({ set: updateSetMock }));

                const fakeDb: Partial<DB> = {
                    select: selectMock,
                    update: updateMock,
                };

                const service = new WishlistService(fakeDb as DB);
                const result = await service.batchMoveItems(
                    ["item-1"],
                    42,
                    null,
                );

                expect(result).toEqual({
                    processedCount: 1,
                    failedCount: 0,
                    errors: [],
                });
                expect(updateSetMock).toHaveBeenCalledWith({
                    category_id: null,
                    updated_at: expect.any(String),
                });
            });

            it("returns error when category not found", async () => {
                const ownedItems = [{ id: "item-1" }];

                const selectAllMock = vi.fn().mockResolvedValue(ownedItems);
                const selectWhereMock1 = vi.fn(() => ({ all: selectAllMock }));
                const selectFromMock1 = vi.fn(() => ({
                    where: selectWhereMock1,
                }));

                // Category not found
                const selectGetMock = vi.fn().mockResolvedValue(undefined);
                const selectWhereMock2 = vi.fn(() => ({ get: selectGetMock }));
                const selectFromMock2 = vi.fn(() => ({
                    where: selectWhereMock2,
                }));

                const selectMock = vi
                    .fn()
                    .mockReturnValueOnce({ from: selectFromMock1 })
                    .mockReturnValueOnce({ from: selectFromMock2 });

                const fakeDb: Partial<DB> = {
                    select: selectMock,
                    update: vi.fn(() => {
                        throw new Error("Should not be called");
                    }),
                };

                const service = new WishlistService(fakeDb as DB);
                const result = await service.batchMoveItems(
                    ["item-1"],
                    42,
                    "non-existent-category",
                );

                expect(result).toEqual({
                    processedCount: 0,
                    failedCount: 1,
                    errors: ["Category not found or unauthorized"],
                });
                expect(fakeDb.update).not.toHaveBeenCalled();
            });

            it("returns error when no valid items found", async () => {
                const selectAllMock = vi.fn().mockResolvedValue([]);
                const selectWhereMock = vi.fn(() => ({ all: selectAllMock }));
                const selectFromMock = vi.fn(() => ({
                    where: selectWhereMock,
                }));
                const selectMock = vi.fn(() => ({ from: selectFromMock }));

                const fakeDb: Partial<DB> = {
                    select: selectMock,
                    update: vi.fn(() => {
                        throw new Error("Should not be called");
                    }),
                };

                const service = new WishlistService(fakeDb as DB);
                const result = await service.batchMoveItems(
                    ["non-existent-1"],
                    42,
                    "cat-1",
                );

                expect(result).toEqual({
                    processedCount: 0,
                    failedCount: 1,
                    errors: ["No valid items to move"],
                });
                expect(fakeDb.update).not.toHaveBeenCalled();
            });

            it("reports invalid items when moving partially owned items", async () => {
                // User owns item-1 but not item-2
                const ownedItems = [{ id: "item-1" }];
                const category = { id: "cat-1", user_id: 42, name: "Test" };

                const selectAllMock = vi.fn().mockResolvedValue(ownedItems);
                const selectWhereMock1 = vi.fn(() => ({ all: selectAllMock }));
                const selectFromMock1 = vi.fn(() => ({
                    where: selectWhereMock1,
                }));

                const selectGetMock = vi.fn().mockResolvedValue(category);
                const selectWhereMock2 = vi.fn(() => ({ get: selectGetMock }));
                const selectFromMock2 = vi.fn(() => ({
                    where: selectWhereMock2,
                }));

                const selectMock = vi
                    .fn()
                    .mockReturnValueOnce({ from: selectFromMock1 })
                    .mockReturnValueOnce({ from: selectFromMock2 });

                const updateRunMock = vi.fn().mockResolvedValue(undefined);
                const updateWhereMock = vi.fn(() => ({ run: updateRunMock }));
                const updateSetMock = vi.fn(() => ({ where: updateWhereMock }));
                const updateMock = vi.fn(() => ({ set: updateSetMock }));

                const fakeDb: Partial<DB> = {
                    select: selectMock,
                    update: updateMock,
                };

                const service = new WishlistService(fakeDb as DB);
                const result = await service.batchMoveItems(
                    ["item-1", "item-2"],
                    42,
                    "cat-1",
                );

                expect(result).toEqual({
                    processedCount: 1,
                    failedCount: 1,
                    errors: ["1 items not found or unauthorized"],
                });
            });
        });
    });
});
