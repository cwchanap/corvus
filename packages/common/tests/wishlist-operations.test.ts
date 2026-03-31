import { describe, expect, it } from "vitest";
import { RECENT_ITEMS_QUERY } from "../src/graphql/operations/wishlist";

describe("RECENT_ITEMS_QUERY", () => {
    it("requests the full wishlist item shape used by the web app", () => {
        expect(RECENT_ITEMS_QUERY).toContain("description");
        expect(RECENT_ITEMS_QUERY).toContain("favicon");
        expect(RECENT_ITEMS_QUERY).toContain("userId");
        expect(RECENT_ITEMS_QUERY).toContain("updatedAt");
        expect(RECENT_ITEMS_QUERY).toContain("itemId");
        expect(RECENT_ITEMS_QUERY).toContain("createdAt");
        expect(RECENT_ITEMS_QUERY).toContain("updatedAt");
        expect(RECENT_ITEMS_QUERY).toContain("description");
    });
});
