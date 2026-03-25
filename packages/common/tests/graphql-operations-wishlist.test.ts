import { describe, it, expect, vi, beforeEach } from "vitest";
import {
    getWishlist,
    getCategories,
    getItem,
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
    WISHLIST_QUERY,
    CATEGORIES_QUERY,
    ITEM_QUERY,
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
} from "../src/graphql/operations/wishlist";
import * as client from "../src/graphql/client";

vi.mock("../src/graphql/client", () => ({
    graphqlRequest: vi.fn(),
}));

const mockedRequest = vi.mocked(client.graphqlRequest);

// Shared fixtures
const mockCategory = {
    id: "cat-1",
    name: "Electronics",
    color: "#ff0000",
    userId: "user-1",
    createdAt: "2024-01-01",
    updatedAt: "2024-01-02",
};

const mockLink = {
    id: "link-1",
    url: "https://example.com",
    description: "Example",
    itemId: "item-1",
    isPrimary: true,
    createdAt: "2024-01-01",
    updatedAt: "2024-01-02",
};

const mockItem = {
    id: "item-1",
    title: "Test Item",
    description: "A test item",
    categoryId: "cat-1",
    favicon: "https://example.com/favicon.ico",
    userId: "user-1",
    createdAt: "2024-01-01",
    updatedAt: "2024-01-02",
    links: [mockLink],
};

const mockPagination = {
    totalItems: 1,
    page: 1,
    pageSize: 20,
    totalPages: 1,
    hasNext: false,
    hasPrevious: false,
};

describe("wishlist query/mutation strings", () => {
    it("WISHLIST_QUERY contains wishlist operation", () => {
        expect(WISHLIST_QUERY).toContain("query Wishlist");
        expect(WISHLIST_QUERY).toContain("wishlist(");
    });

    it("CATEGORIES_QUERY contains categories operation", () => {
        expect(CATEGORIES_QUERY).toContain("query Categories");
        expect(CATEGORIES_QUERY).toContain("categories {");
    });

    it("ITEM_QUERY contains item operation", () => {
        expect(ITEM_QUERY).toContain("query Item");
        expect(ITEM_QUERY).toContain("item(id:");
    });

    it("CREATE_CATEGORY_MUTATION contains createCategory", () => {
        expect(CREATE_CATEGORY_MUTATION).toContain("mutation CreateCategory");
    });

    it("BATCH_DELETE_ITEMS_MUTATION contains batchDeleteItems", () => {
        expect(BATCH_DELETE_ITEMS_MUTATION).toContain("batchDeleteItems");
    });

    it("BATCH_MOVE_ITEMS_MUTATION contains batchMoveItems", () => {
        expect(BATCH_MOVE_ITEMS_MUTATION).toContain("batchMoveItems");
    });
});

describe("getWishlist", () => {
    beforeEach(() => vi.clearAllMocks());

    it("returns wishlist payload", async () => {
        const mockPayload = {
            categories: [mockCategory],
            items: [mockItem],
            pagination: mockPagination,
        };
        mockedRequest.mockResolvedValueOnce({ wishlist: mockPayload });

        const result = await getWishlist();

        expect(result).toEqual(mockPayload);
        expect(mockedRequest).toHaveBeenCalledWith(
            WISHLIST_QUERY,
            { filter: undefined, pagination: undefined },
            undefined,
        );
    });

    it("passes filter and pagination parameters", async () => {
        const mockPayload = {
            categories: [],
            items: [],
            pagination: mockPagination,
        };
        mockedRequest.mockResolvedValueOnce({ wishlist: mockPayload });
        const filter = { search: "laptop" };
        const pagination = { page: 2, pageSize: 10 };

        await getWishlist(filter, pagination);

        expect(mockedRequest).toHaveBeenCalledWith(
            WISHLIST_QUERY,
            { filter, pagination },
            undefined,
        );
    });

    it("passes options to graphqlRequest", async () => {
        mockedRequest.mockResolvedValueOnce({
            wishlist: { categories: [], items: [], pagination: mockPagination },
        });
        const options = { endpoint: "https://custom.example.com/graphql" };

        await getWishlist(undefined, undefined, options);

        expect(mockedRequest).toHaveBeenCalledWith(
            WISHLIST_QUERY,
            expect.anything(),
            options,
        );
    });

    it("propagates errors", async () => {
        mockedRequest.mockRejectedValueOnce(new Error("Unauthorized"));
        await expect(getWishlist()).rejects.toThrow("Unauthorized");
    });
});

describe("getCategories", () => {
    beforeEach(() => vi.clearAllMocks());

    it("returns array of categories", async () => {
        mockedRequest.mockResolvedValueOnce({ categories: [mockCategory] });

        const result = await getCategories();

        expect(result).toEqual([mockCategory]);
        expect(mockedRequest).toHaveBeenCalledWith(
            CATEGORIES_QUERY,
            undefined,
            undefined,
        );
    });

    it("passes options to graphqlRequest", async () => {
        mockedRequest.mockResolvedValueOnce({ categories: [] });
        const options = { credentials: "omit" as const };

        await getCategories(options);

        expect(mockedRequest).toHaveBeenCalledWith(
            CATEGORIES_QUERY,
            undefined,
            options,
        );
    });

    it("propagates errors", async () => {
        mockedRequest.mockRejectedValueOnce(new Error("Forbidden"));
        await expect(getCategories()).rejects.toThrow("Forbidden");
    });
});

describe("getItem", () => {
    beforeEach(() => vi.clearAllMocks());

    it("returns item when found", async () => {
        mockedRequest.mockResolvedValueOnce({ item: mockItem });

        const result = await getItem("item-1");

        expect(result).toEqual(mockItem);
        expect(mockedRequest).toHaveBeenCalledWith(
            ITEM_QUERY,
            { id: "item-1" },
            undefined,
        );
    });

    it("returns null when item not found", async () => {
        mockedRequest.mockResolvedValueOnce({ item: null });

        const result = await getItem("nonexistent");

        expect(result).toBeNull();
    });

    it("passes options to graphqlRequest", async () => {
        mockedRequest.mockResolvedValueOnce({ item: null });
        const options = { endpoint: "https://other.example.com/graphql" };

        await getItem("item-1", options);

        expect(mockedRequest).toHaveBeenCalledWith(
            ITEM_QUERY,
            { id: "item-1" },
            options,
        );
    });

    it("propagates errors", async () => {
        mockedRequest.mockRejectedValueOnce(new Error("Not found"));
        await expect(getItem("item-1")).rejects.toThrow("Not found");
    });
});

describe("createCategory", () => {
    beforeEach(() => vi.clearAllMocks());

    it("returns created category", async () => {
        mockedRequest.mockResolvedValueOnce({ createCategory: mockCategory });
        const input = { name: "Electronics", color: "#ff0000" };

        const result = await createCategory(input);

        expect(result).toEqual(mockCategory);
        expect(mockedRequest).toHaveBeenCalledWith(
            CREATE_CATEGORY_MUTATION,
            { input },
            undefined,
        );
    });

    it("passes options to graphqlRequest", async () => {
        mockedRequest.mockResolvedValueOnce({ createCategory: mockCategory });
        const options = { endpoint: "https://api.example.com/graphql" };

        await createCategory({ name: "Books" }, options);

        expect(mockedRequest).toHaveBeenCalledWith(
            CREATE_CATEGORY_MUTATION,
            expect.anything(),
            options,
        );
    });

    it("propagates errors", async () => {
        mockedRequest.mockRejectedValueOnce(new Error("Unauthorized"));
        await expect(createCategory({ name: "Books" })).rejects.toThrow(
            "Unauthorized",
        );
    });
});

describe("updateCategory", () => {
    beforeEach(() => vi.clearAllMocks());

    it("returns updated category", async () => {
        const updatedCategory = { ...mockCategory, name: "Updated" };
        mockedRequest.mockResolvedValueOnce({
            updateCategory: updatedCategory,
        });
        const input = { name: "Updated" };

        const result = await updateCategory("cat-1", input);

        expect(result).toEqual(updatedCategory);
        expect(mockedRequest).toHaveBeenCalledWith(
            UPDATE_CATEGORY_MUTATION,
            { id: "cat-1", input },
            undefined,
        );
    });

    it("returns null when category not found", async () => {
        mockedRequest.mockResolvedValueOnce({ updateCategory: null });

        const result = await updateCategory("nonexistent", { name: "X" });

        expect(result).toBeNull();
    });

    it("passes options to graphqlRequest", async () => {
        mockedRequest.mockResolvedValueOnce({ updateCategory: mockCategory });
        const options = { endpoint: "https://api.example.com/graphql" };

        await updateCategory("cat-1", { name: "X" }, options);

        expect(mockedRequest).toHaveBeenCalledWith(
            UPDATE_CATEGORY_MUTATION,
            expect.anything(),
            options,
        );
    });

    it("propagates errors", async () => {
        mockedRequest.mockRejectedValueOnce(new Error("Unauthorized"));
        await expect(updateCategory("cat-1", { name: "X" })).rejects.toThrow(
            "Unauthorized",
        );
    });
});

describe("deleteCategory", () => {
    beforeEach(() => vi.clearAllMocks());

    it("returns true on successful deletion", async () => {
        mockedRequest.mockResolvedValueOnce({ deleteCategory: true });

        const result = await deleteCategory("cat-1");

        expect(result).toBe(true);
        expect(mockedRequest).toHaveBeenCalledWith(
            DELETE_CATEGORY_MUTATION,
            { id: "cat-1" },
            undefined,
        );
    });

    it("returns false when deletion fails", async () => {
        mockedRequest.mockResolvedValueOnce({ deleteCategory: false });

        const result = await deleteCategory("nonexistent");

        expect(result).toBe(false);
    });

    it("passes options to graphqlRequest", async () => {
        mockedRequest.mockResolvedValueOnce({ deleteCategory: true });
        const options = { endpoint: "https://api.example.com/graphql" };

        await deleteCategory("cat-1", options);

        expect(mockedRequest).toHaveBeenCalledWith(
            DELETE_CATEGORY_MUTATION,
            expect.anything(),
            options,
        );
    });

    it("propagates errors", async () => {
        mockedRequest.mockRejectedValueOnce(new Error("Unauthorized"));
        await expect(deleteCategory("cat-1")).rejects.toThrow("Unauthorized");
    });
});

describe("createItem", () => {
    beforeEach(() => vi.clearAllMocks());

    it("returns created item", async () => {
        mockedRequest.mockResolvedValueOnce({ createItem: mockItem });
        const input = { title: "Test Item", categoryId: "cat-1" };

        const result = await createItem(input);

        expect(result).toEqual(mockItem);
        expect(mockedRequest).toHaveBeenCalledWith(
            CREATE_ITEM_MUTATION,
            { input },
            undefined,
        );
    });

    it("passes options to graphqlRequest", async () => {
        mockedRequest.mockResolvedValueOnce({ createItem: mockItem });
        const options = { endpoint: "https://api.example.com/graphql" };

        await createItem({ title: "X" }, options);

        expect(mockedRequest).toHaveBeenCalledWith(
            CREATE_ITEM_MUTATION,
            expect.anything(),
            options,
        );
    });

    it("propagates errors", async () => {
        mockedRequest.mockRejectedValueOnce(new Error("Unauthorized"));
        await expect(createItem({ title: "X" })).rejects.toThrow(
            "Unauthorized",
        );
    });
});

describe("updateItem", () => {
    beforeEach(() => vi.clearAllMocks());

    it("returns updated item", async () => {
        const updatedItem = { ...mockItem, title: "Updated Item" };
        mockedRequest.mockResolvedValueOnce({ updateItem: updatedItem });
        const input = { title: "Updated Item" };

        const result = await updateItem("item-1", input);

        expect(result).toEqual(updatedItem);
        expect(mockedRequest).toHaveBeenCalledWith(
            UPDATE_ITEM_MUTATION,
            { id: "item-1", input },
            undefined,
        );
    });

    it("returns null when item not found", async () => {
        mockedRequest.mockResolvedValueOnce({ updateItem: null });

        const result = await updateItem("nonexistent", { title: "X" });

        expect(result).toBeNull();
    });

    it("passes options to graphqlRequest", async () => {
        mockedRequest.mockResolvedValueOnce({ updateItem: mockItem });
        const options = { endpoint: "https://api.example.com/graphql" };

        await updateItem("item-1", { title: "X" }, options);

        expect(mockedRequest).toHaveBeenCalledWith(
            UPDATE_ITEM_MUTATION,
            expect.anything(),
            options,
        );
    });

    it("propagates errors", async () => {
        mockedRequest.mockRejectedValueOnce(new Error("Unauthorized"));
        await expect(updateItem("item-1", { title: "X" })).rejects.toThrow(
            "Unauthorized",
        );
    });
});

describe("deleteItem", () => {
    beforeEach(() => vi.clearAllMocks());

    it("returns true on successful deletion", async () => {
        mockedRequest.mockResolvedValueOnce({ deleteItem: true });

        const result = await deleteItem("item-1");

        expect(result).toBe(true);
        expect(mockedRequest).toHaveBeenCalledWith(
            DELETE_ITEM_MUTATION,
            { id: "item-1" },
            undefined,
        );
    });

    it("returns false when item not found", async () => {
        mockedRequest.mockResolvedValueOnce({ deleteItem: false });

        const result = await deleteItem("nonexistent");

        expect(result).toBe(false);
    });

    it("passes options to graphqlRequest", async () => {
        mockedRequest.mockResolvedValueOnce({ deleteItem: true });
        const options = { endpoint: "https://api.example.com/graphql" };

        await deleteItem("item-1", options);

        expect(mockedRequest).toHaveBeenCalledWith(
            DELETE_ITEM_MUTATION,
            expect.anything(),
            options,
        );
    });

    it("propagates errors", async () => {
        mockedRequest.mockRejectedValueOnce(new Error("Unauthorized"));
        await expect(deleteItem("item-1")).rejects.toThrow("Unauthorized");
    });
});

describe("addItemLink", () => {
    beforeEach(() => vi.clearAllMocks());

    it("returns created link", async () => {
        mockedRequest.mockResolvedValueOnce({ addItemLink: mockLink });
        const input = {
            url: "https://example.com",
            description: "Example",
            isPrimary: true,
        };

        const result = await addItemLink("item-1", input);

        expect(result).toEqual(mockLink);
        expect(mockedRequest).toHaveBeenCalledWith(
            ADD_ITEM_LINK_MUTATION,
            { itemId: "item-1", input },
            undefined,
        );
    });

    it("passes options to graphqlRequest", async () => {
        mockedRequest.mockResolvedValueOnce({ addItemLink: mockLink });
        const options = { endpoint: "https://api.example.com/graphql" };

        await addItemLink("item-1", { url: "https://example.com" }, options);

        expect(mockedRequest).toHaveBeenCalledWith(
            ADD_ITEM_LINK_MUTATION,
            expect.anything(),
            options,
        );
    });

    it("propagates errors", async () => {
        mockedRequest.mockRejectedValueOnce(new Error("Unauthorized"));
        await expect(
            addItemLink("item-1", { url: "https://example.com" }),
        ).rejects.toThrow("Unauthorized");
    });
});

describe("updateItemLink", () => {
    beforeEach(() => vi.clearAllMocks());

    it("returns updated link", async () => {
        const updatedLink = { ...mockLink, description: "Updated" };
        mockedRequest.mockResolvedValueOnce({ updateItemLink: updatedLink });
        const input = { description: "Updated" };

        const result = await updateItemLink("link-1", input);

        expect(result).toEqual(updatedLink);
        expect(mockedRequest).toHaveBeenCalledWith(
            UPDATE_ITEM_LINK_MUTATION,
            { id: "link-1", input },
            undefined,
        );
    });

    it("returns null when link not found", async () => {
        mockedRequest.mockResolvedValueOnce({ updateItemLink: null });

        const result = await updateItemLink("nonexistent", {});

        expect(result).toBeNull();
    });

    it("passes options to graphqlRequest", async () => {
        mockedRequest.mockResolvedValueOnce({ updateItemLink: mockLink });
        const options = { endpoint: "https://api.example.com/graphql" };

        await updateItemLink("link-1", {}, options);

        expect(mockedRequest).toHaveBeenCalledWith(
            UPDATE_ITEM_LINK_MUTATION,
            expect.anything(),
            options,
        );
    });

    it("propagates errors", async () => {
        mockedRequest.mockRejectedValueOnce(new Error("Unauthorized"));
        await expect(updateItemLink("link-1", {})).rejects.toThrow(
            "Unauthorized",
        );
    });
});

describe("deleteItemLink", () => {
    beforeEach(() => vi.clearAllMocks());

    it("returns true on successful deletion", async () => {
        mockedRequest.mockResolvedValueOnce({ deleteItemLink: true });

        const result = await deleteItemLink("link-1");

        expect(result).toBe(true);
        expect(mockedRequest).toHaveBeenCalledWith(
            DELETE_ITEM_LINK_MUTATION,
            { id: "link-1" },
            undefined,
        );
    });

    it("returns false when link not found", async () => {
        mockedRequest.mockResolvedValueOnce({ deleteItemLink: false });

        const result = await deleteItemLink("nonexistent");

        expect(result).toBe(false);
    });

    it("passes options to graphqlRequest", async () => {
        mockedRequest.mockResolvedValueOnce({ deleteItemLink: true });
        const options = { endpoint: "https://api.example.com/graphql" };

        await deleteItemLink("link-1", options);

        expect(mockedRequest).toHaveBeenCalledWith(
            DELETE_ITEM_LINK_MUTATION,
            expect.anything(),
            options,
        );
    });

    it("propagates errors", async () => {
        mockedRequest.mockRejectedValueOnce(new Error("Unauthorized"));
        await expect(deleteItemLink("link-1")).rejects.toThrow("Unauthorized");
    });
});

describe("setPrimaryLink", () => {
    beforeEach(() => vi.clearAllMocks());

    it("returns true on success", async () => {
        mockedRequest.mockResolvedValueOnce({ setPrimaryLink: true });

        const result = await setPrimaryLink("item-1", "link-1");

        expect(result).toBe(true);
        expect(mockedRequest).toHaveBeenCalledWith(
            SET_PRIMARY_LINK_MUTATION,
            { itemId: "item-1", linkId: "link-1" },
            undefined,
        );
    });

    it("returns false when operation fails", async () => {
        mockedRequest.mockResolvedValueOnce({ setPrimaryLink: false });

        const result = await setPrimaryLink("item-1", "nonexistent");

        expect(result).toBe(false);
    });

    it("passes options to graphqlRequest", async () => {
        mockedRequest.mockResolvedValueOnce({ setPrimaryLink: true });
        const options = { endpoint: "https://api.example.com/graphql" };

        await setPrimaryLink("item-1", "link-1", options);

        expect(mockedRequest).toHaveBeenCalledWith(
            SET_PRIMARY_LINK_MUTATION,
            expect.anything(),
            options,
        );
    });

    it("propagates errors", async () => {
        mockedRequest.mockRejectedValueOnce(new Error("Unauthorized"));
        await expect(setPrimaryLink("item-1", "link-1")).rejects.toThrow(
            "Unauthorized",
        );
    });
});

describe("batchDeleteItems", () => {
    beforeEach(() => vi.clearAllMocks());

    it("returns batch operation result", async () => {
        const mockResult = {
            success: true,
            processedCount: 3,
            failedCount: 0,
            errors: [],
        };
        mockedRequest.mockResolvedValueOnce({ batchDeleteItems: mockResult });
        const input = { itemIds: ["item-1", "item-2", "item-3"] };

        const result = await batchDeleteItems(input);

        expect(result).toEqual(mockResult);
        expect(mockedRequest).toHaveBeenCalledWith(
            BATCH_DELETE_ITEMS_MUTATION,
            { input },
            undefined,
        );
    });

    it("returns partial failure result", async () => {
        const mockResult = {
            success: false,
            processedCount: 2,
            failedCount: 1,
            errors: ["item-3 not found"],
        };
        mockedRequest.mockResolvedValueOnce({ batchDeleteItems: mockResult });

        const result = await batchDeleteItems({
            itemIds: ["item-1", "item-2", "item-3"],
        });

        expect(result.failedCount).toBe(1);
        expect(result.errors).toHaveLength(1);
    });

    it("passes options to graphqlRequest", async () => {
        mockedRequest.mockResolvedValueOnce({
            batchDeleteItems: {
                success: true,
                processedCount: 0,
                failedCount: 0,
                errors: [],
            },
        });
        const options = { endpoint: "https://api.example.com/graphql" };

        await batchDeleteItems({ itemIds: [] }, options);

        expect(mockedRequest).toHaveBeenCalledWith(
            BATCH_DELETE_ITEMS_MUTATION,
            expect.anything(),
            options,
        );
    });

    it("propagates errors", async () => {
        mockedRequest.mockRejectedValueOnce(new Error("Unauthorized"));
        await expect(batchDeleteItems({ itemIds: ["item-1"] })).rejects.toThrow(
            "Unauthorized",
        );
    });
});

describe("batchMoveItems", () => {
    beforeEach(() => vi.clearAllMocks());

    it("returns batch operation result", async () => {
        const mockResult = {
            success: true,
            processedCount: 2,
            failedCount: 0,
            errors: [],
        };
        mockedRequest.mockResolvedValueOnce({ batchMoveItems: mockResult });
        const input = { itemIds: ["item-1", "item-2"], categoryId: "cat-2" };

        const result = await batchMoveItems(input);

        expect(result).toEqual(mockResult);
        expect(mockedRequest).toHaveBeenCalledWith(
            BATCH_MOVE_ITEMS_MUTATION,
            { input },
            undefined,
        );
    });

    it("returns partial failure result", async () => {
        const mockResult = {
            success: false,
            processedCount: 1,
            failedCount: 1,
            errors: ["item-2 not found"],
        };
        mockedRequest.mockResolvedValueOnce({ batchMoveItems: mockResult });

        const result = await batchMoveItems({
            itemIds: ["item-1", "item-2"],
            categoryId: "cat-2",
        });

        expect(result.failedCount).toBe(1);
    });

    it("passes options to graphqlRequest", async () => {
        mockedRequest.mockResolvedValueOnce({
            batchMoveItems: {
                success: true,
                processedCount: 0,
                failedCount: 0,
                errors: [],
            },
        });
        const options = { endpoint: "https://api.example.com/graphql" };

        await batchMoveItems({ itemIds: [], categoryId: "cat-1" }, options);

        expect(mockedRequest).toHaveBeenCalledWith(
            BATCH_MOVE_ITEMS_MUTATION,
            expect.anything(),
            options,
        );
    });

    it("propagates errors", async () => {
        mockedRequest.mockRejectedValueOnce(new Error("Unauthorized"));
        await expect(
            batchMoveItems({ itemIds: ["item-1"], categoryId: "cat-1" }),
        ).rejects.toThrow("Unauthorized");
    });
});
