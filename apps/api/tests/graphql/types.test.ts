import { describe, it, expect } from "vitest";
// Import as runtime values (not `import type`) so V8 executes the enum initialisation
import { SortDirection, WishlistSortKey } from "../../src/graphql/types";

describe("GraphQL enum values", () => {
    describe("SortDirection", () => {
        it("has correct ASC and DESC values", () => {
            expect(SortDirection.Asc).toBe("ASC");
            expect(SortDirection.Desc).toBe("DESC");
        });
    });

    describe("WishlistSortKey", () => {
        it("has correct sort key values", () => {
            expect(WishlistSortKey.CreatedAt).toBe("CREATED_AT");
            expect(WishlistSortKey.Name).toBe("NAME");
            expect(WishlistSortKey.Title).toBe("TITLE");
            expect(WishlistSortKey.UpdatedAt).toBe("UPDATED_AT");
        });
    });
});
