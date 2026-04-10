import { describe, expect, it } from "vitest";
import { RECENT_ITEMS_QUERY } from "../src/graphql/operations/wishlist";

describe("RECENT_ITEMS_QUERY", () => {
    it("requests the full wishlist item shape used by the web app", () => {
        // Top-level item fields
        expect(RECENT_ITEMS_QUERY).toContain("id");
        expect(RECENT_ITEMS_QUERY).toContain("title");
        expect(RECENT_ITEMS_QUERY).toContain("description");
        expect(RECENT_ITEMS_QUERY).toContain("categoryId");
        expect(RECENT_ITEMS_QUERY).toContain("favicon");
        expect(RECENT_ITEMS_QUERY).toContain("status");
        expect(RECENT_ITEMS_QUERY).toContain("priority");
        expect(RECENT_ITEMS_QUERY).toContain("userId");
        expect(RECENT_ITEMS_QUERY).toContain("createdAt");
        expect(RECENT_ITEMS_QUERY).toContain("updatedAt");

        // Nested links fragment
        expect(RECENT_ITEMS_QUERY).toContain("links");
        expect(RECENT_ITEMS_QUERY).toContain("url");
        expect(RECENT_ITEMS_QUERY).toContain("isPrimary");
        expect(RECENT_ITEMS_QUERY).toContain("itemId");
    });
});
