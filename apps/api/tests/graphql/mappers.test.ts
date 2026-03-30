import { describe, expect, it } from "vitest";
import {
    mapUser,
    mapCategory,
    mapItem,
    mapLink,
} from "../../src/graphql/mappers";
import type {
    PublicUser,
    WishlistCategory,
    WishlistItem,
    WishlistItemLink,
} from "../../src/lib/db/types";

const dbUser: PublicUser = {
    id: "user-1",
    email: "test@example.com",
    name: "Test User",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-02T00:00:00Z",
};

const dbCategory: WishlistCategory = {
    id: "cat-1",
    user_id: "user-1",
    name: "General",
    color: "#ff0000",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-02T00:00:00Z",
};

const dbItem: WishlistItem = {
    id: "item-1",
    user_id: "user-1",
    category_id: "cat-1",
    title: "My Item",
    description: "A description",
    favicon: "https://example.com/favicon.ico",
    status: "want" as const,
    priority: null,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-02T00:00:00Z",
};

const dbLink: WishlistItemLink = {
    id: "link-1",
    item_id: "item-1",
    url: "https://example.com",
    description: "Example link",
    is_primary: true,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-02T00:00:00Z",
};

describe("mapUser", () => {
    it("maps snake_case DB fields to camelCase GraphQL fields", () => {
        expect(mapUser(dbUser)).toEqual({
            id: "user-1",
            email: "test@example.com",
            name: "Test User",
            createdAt: "2024-01-01T00:00:00Z",
            updatedAt: "2024-01-02T00:00:00Z",
        });
    });
});

describe("mapCategory", () => {
    it("maps snake_case DB fields to camelCase GraphQL fields", () => {
        expect(mapCategory(dbCategory)).toEqual({
            id: "cat-1",
            userId: "user-1",
            name: "General",
            color: "#ff0000",
            createdAt: "2024-01-01T00:00:00Z",
            updatedAt: "2024-01-02T00:00:00Z",
        });
    });

    it("preserves null color", () => {
        const result = mapCategory({ ...dbCategory, color: null });
        expect(result.color).toBeNull();
    });
});

describe("mapLink", () => {
    it("maps snake_case DB fields to camelCase GraphQL fields", () => {
        expect(mapLink(dbLink)).toEqual({
            id: "link-1",
            itemId: "item-1",
            url: "https://example.com",
            description: "Example link",
            isPrimary: true,
            createdAt: "2024-01-01T00:00:00Z",
            updatedAt: "2024-01-02T00:00:00Z",
        });
    });

    it("maps non-primary link", () => {
        const result = mapLink({ ...dbLink, is_primary: false });
        expect(result.isPrimary).toBe(false);
    });

    it("preserves null description", () => {
        const result = mapLink({ ...dbLink, description: null });
        expect(result.description).toBeNull();
    });
});

describe("mapItem", () => {
    it("maps snake_case DB fields to camelCase GraphQL fields", () => {
        expect(mapItem(dbItem)).toEqual({
            id: "item-1",
            userId: "user-1",
            categoryId: "cat-1",
            title: "My Item",
            description: "A description",
            favicon: "https://example.com/favicon.ico",
            status: "WANT",
            priority: null,
            createdAt: "2024-01-01T00:00:00Z",
            updatedAt: "2024-01-02T00:00:00Z",
            links: [],
        });
    });

    it("returns empty links array when no links provided", () => {
        const result = mapItem(dbItem);
        expect(result.links).toEqual([]);
    });

    it("maps provided links", () => {
        const result = mapItem(dbItem, [dbLink]);
        expect(result.links).toHaveLength(1);
        expect(result.links[0]).toMatchObject({
            id: "link-1",
            url: "https://example.com",
            isPrimary: true,
        });
    });

    it("maps multiple links", () => {
        const link2: WishlistItemLink = {
            ...dbLink,
            id: "link-2",
            is_primary: false,
        };
        const result = mapItem(dbItem, [dbLink, link2]);
        expect(result.links).toHaveLength(2);
    });

    it("preserves null category_id", () => {
        const result = mapItem({ ...dbItem, category_id: null });
        expect(result.categoryId).toBeNull();
    });

    it("preserves null description and favicon", () => {
        const result = mapItem({ ...dbItem, description: null, favicon: null });
        expect(result.description).toBeNull();
        expect(result.favicon).toBeNull();
    });
});
