import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("wishlist SQL migrations", () => {
    it("enforces wishlist item priority range with SQLite-safe triggers", () => {
        const migration = readFileSync(
            new URL(
                "../../drizzle/0007_item_status_priority.sql",
                import.meta.url,
            ),
            "utf8",
        );

        expect(migration).not.toContain("CREATE CHECK");
        expect(migration).toContain(
            "CREATE TRIGGER `wishlist_items_priority_range_insert`",
        );
        expect(migration).toContain(
            "CREATE TRIGGER `wishlist_items_priority_range_update`",
        );
    });
});
