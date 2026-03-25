import { describe, it, expect } from "vitest";
import {
    adaptCategory,
    adaptLink,
    adaptItem,
    adaptPagination,
    adaptWishlistData,
} from "./adapters";

const graphqlCategory = {
    id: "cat-1",
    name: "Electronics",
    color: "#ff0000",
    userId: "user-1",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-02T00:00:00Z",
};

const graphqlLink = {
    id: "link-1",
    url: "https://example.com/product",
    description: "Product page",
    itemId: "item-1",
    isPrimary: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-02T00:00:00Z",
};

const graphqlItem = {
    id: "item-1",
    title: "Laptop",
    description: "A great laptop",
    categoryId: "cat-1",
    favicon: "https://example.com/favicon.ico",
    userId: "user-1",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-02T00:00:00Z",
    links: [graphqlLink],
};

const graphqlPagination = {
    totalItems: 42,
    page: 2,
    pageSize: 10,
    totalPages: 5,
    hasNext: true,
    hasPrevious: true,
};

describe("adaptCategory", () => {
    it("maps all fields from camelCase to snake_case", () => {
        const result = adaptCategory(graphqlCategory);

        expect(result).toEqual({
            id: "cat-1",
            user_id: "user-1",
            name: "Electronics",
            color: "#ff0000",
            created_at: "2024-01-01T00:00:00Z",
            updated_at: "2024-01-02T00:00:00Z",
        });
    });

    it("maps color as undefined when null", () => {
        const result = adaptCategory({
            ...graphqlCategory,
            color: null as unknown as string,
        });

        expect(result.color).toBeUndefined();
    });

    it("preserves color when provided", () => {
        const result = adaptCategory({ ...graphqlCategory, color: "#00ff00" });

        expect(result.color).toBe("#00ff00");
    });
});

describe("adaptLink", () => {
    it("maps all fields from camelCase to snake_case", () => {
        const result = adaptLink(graphqlLink);

        expect(result).toEqual({
            id: "link-1",
            item_id: "item-1",
            url: "https://example.com/product",
            description: "Product page",
            is_primary: true,
            created_at: "2024-01-01T00:00:00Z",
            updated_at: "2024-01-02T00:00:00Z",
        });
    });

    it("maps description as undefined when null", () => {
        const result = adaptLink({
            ...graphqlLink,
            description: null as unknown as string,
        });

        expect(result.description).toBeUndefined();
    });

    it("maps isPrimary false correctly", () => {
        const result = adaptLink({ ...graphqlLink, isPrimary: false });

        expect(result.is_primary).toBe(false);
    });
});

describe("adaptItem", () => {
    it("maps all fields from camelCase to snake_case", () => {
        const result = adaptItem(graphqlItem);

        expect(result).toEqual({
            id: "item-1",
            user_id: "user-1",
            category_id: "cat-1",
            title: "Laptop",
            description: "A great laptop",
            favicon: "https://example.com/favicon.ico",
            created_at: "2024-01-01T00:00:00Z",
            updated_at: "2024-01-02T00:00:00Z",
            links: [
                {
                    id: "link-1",
                    item_id: "item-1",
                    url: "https://example.com/product",
                    description: "Product page",
                    is_primary: true,
                    created_at: "2024-01-01T00:00:00Z",
                    updated_at: "2024-01-02T00:00:00Z",
                },
            ],
        });
    });

    it("maps categoryId as undefined when null", () => {
        const result = adaptItem({
            ...graphqlItem,
            categoryId: null as unknown as string,
        });

        expect(result.category_id).toBeUndefined();
    });

    it("maps description as undefined when null", () => {
        const result = adaptItem({
            ...graphqlItem,
            description: null as unknown as string,
        });

        expect(result.description).toBeUndefined();
    });

    it("maps favicon as undefined when null", () => {
        const result = adaptItem({
            ...graphqlItem,
            favicon: null as unknown as string,
        });

        expect(result.favicon).toBeUndefined();
    });

    it("handles item with no links", () => {
        const result = adaptItem({ ...graphqlItem, links: undefined });

        expect(result.links).toBeUndefined();
    });

    it("handles item with empty links array", () => {
        const result = adaptItem({ ...graphqlItem, links: [] });

        expect(result.links).toEqual([]);
    });

    it("maps multiple links correctly", () => {
        const secondLink = { ...graphqlLink, id: "link-2", isPrimary: false };
        const result = adaptItem({
            ...graphqlItem,
            links: [graphqlLink, secondLink],
        });

        expect(result.links).toHaveLength(2);
        expect(result.links![0].id).toBe("link-1");
        expect(result.links![1].id).toBe("link-2");
    });
});

describe("adaptPagination", () => {
    it("maps all pagination fields from camelCase to snake_case", () => {
        const result = adaptPagination(graphqlPagination);

        expect(result).toEqual({
            total_items: 42,
            page: 2,
            page_size: 10,
            total_pages: 5,
            has_next: true,
            has_previous: true,
        });
    });

    it("handles first page correctly", () => {
        const result = adaptPagination({
            totalItems: 10,
            page: 1,
            pageSize: 20,
            totalPages: 1,
            hasNext: false,
            hasPrevious: false,
        });

        expect(result.has_next).toBe(false);
        expect(result.has_previous).toBe(false);
        expect(result.page).toBe(1);
    });
});

describe("adaptWishlistData", () => {
    it("maps complete wishlist payload", () => {
        const graphqlPayload = {
            categories: [graphqlCategory],
            items: [graphqlItem],
            pagination: graphqlPagination,
        };

        const result = adaptWishlistData(graphqlPayload);

        expect(result.categories).toHaveLength(1);
        expect(result.categories[0].id).toBe("cat-1");
        expect(result.categories[0].user_id).toBe("user-1");

        expect(result.items).toHaveLength(1);
        expect(result.items[0].id).toBe("item-1");
        expect(result.items[0].user_id).toBe("user-1");

        expect(result.pagination.total_items).toBe(42);
        expect(result.pagination.page).toBe(2);
    });

    it("handles empty categories and items", () => {
        const graphqlPayload = {
            categories: [],
            items: [],
            pagination: {
                totalItems: 0,
                page: 1,
                pageSize: 20,
                totalPages: 0,
                hasNext: false,
                hasPrevious: false,
            },
        };

        const result = adaptWishlistData(graphqlPayload);

        expect(result.categories).toEqual([]);
        expect(result.items).toEqual([]);
        expect(result.pagination.total_items).toBe(0);
    });

    it("maps multiple categories and items", () => {
        const secondCategory = {
            ...graphqlCategory,
            id: "cat-2",
            name: "Books",
        };
        const secondItem = { ...graphqlItem, id: "item-2", title: "Novel" };

        const graphqlPayload = {
            categories: [graphqlCategory, secondCategory],
            items: [graphqlItem, secondItem],
            pagination: graphqlPagination,
        };

        const result = adaptWishlistData(graphqlPayload);

        expect(result.categories).toHaveLength(2);
        expect(result.items).toHaveLength(2);
        expect(result.categories[1].name).toBe("Books");
        expect(result.items[1].title).toBe("Novel");
    });
});
