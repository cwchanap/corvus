import { describe, expect, it } from "vitest";
import type { GraphQLWishlistItem } from "@repo/common/graphql/types";
import { adaptItem } from "./adapters";

describe("adaptItem", () => {
    const baseItem: GraphQLWishlistItem = {
        id: "item-1",
        title: "Laptop",
        description: null,
        categoryId: "cat-1",
        favicon: null,
        status: "WANT",
        priority: null,
        userId: "user-1",
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-02T00:00:00Z",
        links: [],
    };

    it("defaults missing status to 'want'", () => {
        const item = {
            ...baseItem,
            status: undefined,
        } as unknown as GraphQLWishlistItem;

        expect(adaptItem(item).status).toBe("want");
    });
});
