import { describe, it, expect, expectTypeOf, vi, beforeEach } from "vitest";
import {
    getWishlist,
    getCategories,
    getItem,
    checkDuplicateUrl,
    createCategory,
    updateCategory,
    deleteCategory,
    createItem,
    updateItem,
    deleteItem,
    addItemLink,
    updateItemLink,
    deleteItemLink,
    setPrimaryLink,
    batchDeleteItems,
    batchMoveItems,
} from "./wishlist";
import * as webClient from "./client";
import {
    WISHLIST_QUERY,
    CATEGORIES_QUERY,
    ITEM_QUERY,
    CHECK_DUPLICATE_URL_QUERY,
    CREATE_CATEGORY_MUTATION,
    UPDATE_CATEGORY_MUTATION,
    DELETE_CATEGORY_MUTATION,
    CREATE_ITEM_MUTATION,
    UPDATE_ITEM_MUTATION,
    DELETE_ITEM_MUTATION,
    ADD_ITEM_LINK_MUTATION,
    UPDATE_ITEM_LINK_MUTATION,
    DELETE_ITEM_LINK_MUTATION,
    SET_PRIMARY_LINK_MUTATION,
    BATCH_DELETE_ITEMS_MUTATION,
    BATCH_MOVE_ITEMS_MUTATION,
} from "@repo/common/graphql/operations/wishlist";
import type { DuplicateUrlCheckResult } from "./wishlist";

vi.mock("./client", () => ({
    graphqlRequest: vi.fn(),
}));

const mockedRequest = vi.mocked(webClient.graphqlRequest);

const mockCategory = {
    id: "cat-1",
    name: "Electronics",
    description: "Electronic items",
    position: 0,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-02T00:00:00Z",
};

const mockItem = {
    id: "item-1",
    title: "Laptop",
    description: "A laptop",
    price: 999.99,
    currency: "USD",
    priority: 1,
    position: 0,
    isPurchased: false,
    categoryId: "cat-1",
    links: [],
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-02T00:00:00Z",
};

const mockLink = {
    id: "link-1",
    url: "https://example.com",
    description: "Product page",
    isPrimary: true,
    itemId: "item-1",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-02T00:00:00Z",
};

beforeEach(() => {
    vi.clearAllMocks();
});

describe("getWishlist", () => {
    it("returns wishlist data", async () => {
        const mockWishlist = {
            items: [mockItem],
            categories: [mockCategory],
            pagination: {
                total: 1,
                page: 1,
                pageSize: 10,
                totalPages: 1,
                hasNextPage: false,
                hasPreviousPage: false,
            },
        };
        mockedRequest.mockResolvedValueOnce({ wishlist: mockWishlist });

        const result = await getWishlist();

        expect(result).toEqual(mockWishlist);
        expect(mockedRequest).toHaveBeenCalledWith(WISHLIST_QUERY, {
            filter: undefined,
            pagination: undefined,
        });
    });

    it("passes filter and pagination to graphqlRequest", async () => {
        const filter = { search: "laptop", categoryId: "cat-1" };
        const pagination = { page: 2, pageSize: 5 };
        mockedRequest.mockResolvedValueOnce({ wishlist: {} });

        await getWishlist(filter, pagination);

        expect(mockedRequest).toHaveBeenCalledWith(WISHLIST_QUERY, {
            filter,
            pagination,
        });
    });

    it("propagates errors from graphqlRequest", async () => {
        mockedRequest.mockRejectedValueOnce(new Error("Network error"));
        await expect(getWishlist()).rejects.toThrow("Network error");
    });
});

describe("getCategories", () => {
    it("returns categories array", async () => {
        mockedRequest.mockResolvedValueOnce({ categories: [mockCategory] });

        const result = await getCategories();

        expect(result).toEqual([mockCategory]);
        expect(mockedRequest).toHaveBeenCalledWith(CATEGORIES_QUERY);
    });

    it("returns empty array when no categories", async () => {
        mockedRequest.mockResolvedValueOnce({ categories: [] });
        const result = await getCategories();
        expect(result).toEqual([]);
    });
});

describe("getItem", () => {
    it("returns item by id", async () => {
        mockedRequest.mockResolvedValueOnce({ item: mockItem });

        const result = await getItem("item-1");

        expect(result).toEqual(mockItem);
        expect(mockedRequest).toHaveBeenCalledWith(ITEM_QUERY, {
            id: "item-1",
        });
    });

    it("returns null when item not found", async () => {
        mockedRequest.mockResolvedValueOnce({ item: null });
        const result = await getItem("nonexistent");
        expect(result).toBeNull();
    });
});

describe("checkDuplicateUrl", () => {
    it("returns duplicate url results", async () => {
        const duplicateResult = {
            isDuplicate: true,
            conflictingItem: {
                id: "item-1",
                title: "Laptop",
                categoryId: "cat-1",
            },
        };
        mockedRequest.mockResolvedValueOnce({
            checkDuplicateUrl: duplicateResult,
        });

        const result = await checkDuplicateUrl("https://example.com");

        expect(result).toEqual(duplicateResult);
        expect(mockedRequest).toHaveBeenCalledWith(CHECK_DUPLICATE_URL_QUERY, {
            url: "https://example.com",
            excludeItemId: undefined,
        });
    });

    it("trims duplicate-check urls before sending the request", async () => {
        mockedRequest.mockResolvedValueOnce({
            checkDuplicateUrl: {
                isDuplicate: false,
                conflictingItem: null,
            },
        });

        await checkDuplicateUrl("  https://example.com/path  ", "item-1");

        expect(mockedRequest).toHaveBeenCalledWith(CHECK_DUPLICATE_URL_QUERY, {
            url: "https://example.com/path",
            excludeItemId: "item-1",
        });
    });

    it("uses the narrowed duplicate item shape", () => {
        expectTypeOf<
            DuplicateUrlCheckResult["conflictingItem"]
        >().toEqualTypeOf<{
            id: string;
            title: string;
            categoryId: string | null;
        } | null>();
    });
});

describe("createCategory", () => {
    it("creates a category and returns it", async () => {
        const input = { name: "Books", description: "Book category" };
        mockedRequest.mockResolvedValueOnce({ createCategory: mockCategory });

        const result = await createCategory(input);

        expect(result).toEqual(mockCategory);
        expect(mockedRequest).toHaveBeenCalledWith(CREATE_CATEGORY_MUTATION, {
            input,
        });
    });
});

describe("updateCategory", () => {
    it("updates a category and returns it", async () => {
        const input = { name: "Updated Electronics" };
        const updated = { ...mockCategory, name: "Updated Electronics" };
        mockedRequest.mockResolvedValueOnce({ updateCategory: updated });

        const result = await updateCategory("cat-1", input);

        expect(result).toEqual(updated);
        expect(mockedRequest).toHaveBeenCalledWith(UPDATE_CATEGORY_MUTATION, {
            id: "cat-1",
            input,
        });
    });

    it("returns null when category not found", async () => {
        mockedRequest.mockResolvedValueOnce({ updateCategory: null });
        const result = await updateCategory("nonexistent", { name: "X" });
        expect(result).toBeNull();
    });
});

describe("deleteCategory", () => {
    it("deletes a category and returns true", async () => {
        mockedRequest.mockResolvedValueOnce({ deleteCategory: true });

        const result = await deleteCategory("cat-1");

        expect(result).toBe(true);
        expect(mockedRequest).toHaveBeenCalledWith(DELETE_CATEGORY_MUTATION, {
            id: "cat-1",
        });
    });

    it("returns false when category not deleted", async () => {
        mockedRequest.mockResolvedValueOnce({ deleteCategory: false });
        const result = await deleteCategory("nonexistent");
        expect(result).toBe(false);
    });
});

describe("createItem", () => {
    it("creates an item and returns it", async () => {
        const input = { title: "Laptop", categoryId: "cat-1" };
        mockedRequest.mockResolvedValueOnce({ createItem: mockItem });

        const result = await createItem(input);

        expect(result).toEqual(mockItem);
        expect(mockedRequest).toHaveBeenCalledWith(CREATE_ITEM_MUTATION, {
            input,
        });
    });
});

describe("updateItem", () => {
    it("updates an item and returns it", async () => {
        const input = { title: "Updated Laptop" };
        const updated = { ...mockItem, title: "Updated Laptop" };
        mockedRequest.mockResolvedValueOnce({ updateItem: updated });

        const result = await updateItem("item-1", input);

        expect(result).toEqual(updated);
        expect(mockedRequest).toHaveBeenCalledWith(UPDATE_ITEM_MUTATION, {
            id: "item-1",
            input,
        });
    });

    it("returns null when item not found", async () => {
        mockedRequest.mockResolvedValueOnce({ updateItem: null });
        const result = await updateItem("nonexistent", { title: "X" });
        expect(result).toBeNull();
    });
});

describe("deleteItem", () => {
    it("deletes an item and returns true", async () => {
        mockedRequest.mockResolvedValueOnce({ deleteItem: true });

        const result = await deleteItem("item-1");

        expect(result).toBe(true);
        expect(mockedRequest).toHaveBeenCalledWith(DELETE_ITEM_MUTATION, {
            id: "item-1",
        });
    });

    it("returns false when item not deleted", async () => {
        mockedRequest.mockResolvedValueOnce({ deleteItem: false });
        const result = await deleteItem("nonexistent");
        expect(result).toBe(false);
    });
});

describe("addItemLink", () => {
    it("adds a link to an item and returns it", async () => {
        const input = {
            url: "https://example.com",
            description: "Product page",
            isPrimary: true,
        };
        mockedRequest.mockResolvedValueOnce({ addItemLink: mockLink });

        const result = await addItemLink("item-1", input);

        expect(result).toEqual(mockLink);
        expect(mockedRequest).toHaveBeenCalledWith(ADD_ITEM_LINK_MUTATION, {
            itemId: "item-1",
            input,
        });
    });
});

describe("updateItemLink", () => {
    it("updates a link and returns it", async () => {
        const input = { url: "https://updated.com" };
        const updated = { ...mockLink, url: "https://updated.com" };
        mockedRequest.mockResolvedValueOnce({ updateItemLink: updated });

        const result = await updateItemLink("link-1", input);

        expect(result).toEqual(updated);
        expect(mockedRequest).toHaveBeenCalledWith(UPDATE_ITEM_LINK_MUTATION, {
            id: "link-1",
            input,
        });
    });

    it("returns null when link not found", async () => {
        mockedRequest.mockResolvedValueOnce({ updateItemLink: null });
        const result = await updateItemLink("nonexistent", {
            url: "https://x.com",
        });
        expect(result).toBeNull();
    });
});

describe("deleteItemLink", () => {
    it("deletes a link and returns true", async () => {
        mockedRequest.mockResolvedValueOnce({ deleteItemLink: true });

        const result = await deleteItemLink("link-1");

        expect(result).toBe(true);
        expect(mockedRequest).toHaveBeenCalledWith(DELETE_ITEM_LINK_MUTATION, {
            id: "link-1",
        });
    });

    it("returns false when link not deleted", async () => {
        mockedRequest.mockResolvedValueOnce({ deleteItemLink: false });
        const result = await deleteItemLink("nonexistent");
        expect(result).toBe(false);
    });
});

describe("setPrimaryLink", () => {
    it("sets primary link and returns true", async () => {
        mockedRequest.mockResolvedValueOnce({ setPrimaryLink: true });

        const result = await setPrimaryLink("item-1", "link-1");

        expect(result).toBe(true);
        expect(mockedRequest).toHaveBeenCalledWith(SET_PRIMARY_LINK_MUTATION, {
            itemId: "item-1",
            linkId: "link-1",
        });
    });

    it("returns false when operation fails", async () => {
        mockedRequest.mockResolvedValueOnce({ setPrimaryLink: false });
        const result = await setPrimaryLink("item-1", "link-1");
        expect(result).toBe(false);
    });
});

describe("batchDeleteItems", () => {
    it("batch deletes items and returns result", async () => {
        const mockResult = { successCount: 2, failedIds: [] };
        mockedRequest.mockResolvedValueOnce({ batchDeleteItems: mockResult });

        const result = await batchDeleteItems(["item-1", "item-2"]);

        expect(result).toEqual(mockResult);
        expect(mockedRequest).toHaveBeenCalledWith(
            BATCH_DELETE_ITEMS_MUTATION,
            {
                input: { itemIds: ["item-1", "item-2"] },
            },
        );
    });

    it("returns partial result when some items fail", async () => {
        const mockResult = { successCount: 1, failedIds: ["item-2"] };
        mockedRequest.mockResolvedValueOnce({ batchDeleteItems: mockResult });
        const result = await batchDeleteItems(["item-1", "item-2"]);
        expect(result.successCount).toBe(1);
        expect(result.failedIds).toContain("item-2");
    });
});

describe("batchMoveItems", () => {
    it("batch moves items to a category and returns result", async () => {
        const mockResult = { successCount: 2, failedIds: [] };
        mockedRequest.mockResolvedValueOnce({ batchMoveItems: mockResult });

        const result = await batchMoveItems(["item-1", "item-2"], "cat-2");

        expect(result).toEqual(mockResult);
        expect(mockedRequest).toHaveBeenCalledWith(BATCH_MOVE_ITEMS_MUTATION, {
            input: { itemIds: ["item-1", "item-2"], categoryId: "cat-2" },
        });
    });

    it("moves items to uncategorized when categoryId is null", async () => {
        const mockResult = { successCount: 1, failedIds: [] };
        mockedRequest.mockResolvedValueOnce({ batchMoveItems: mockResult });

        await batchMoveItems(["item-1"], null);

        expect(mockedRequest).toHaveBeenCalledWith(BATCH_MOVE_ITEMS_MUTATION, {
            input: { itemIds: ["item-1"], categoryId: null },
        });
    });
});
