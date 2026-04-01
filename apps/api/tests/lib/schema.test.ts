import { describe, expect, it } from "vitest";
import { getTableConfig } from "drizzle-orm/sqlite-core";
import {
    wishlistCategories,
    wishlistItems,
    wishlistItemLinks,
} from "../../src/lib/db/schema";

describe("database schema", () => {
    describe("wishlistCategories table", () => {
        it("has correct table name", () => {
            const config = getTableConfig(wishlistCategories);
            expect(config.name).toBe("wishlist_categories");
        });

        it("defines user_id and user_id+name indexes via index callback", () => {
            const config = getTableConfig(wishlistCategories);
            expect(config.indexes.length).toBeGreaterThanOrEqual(1);
            const indexNames = config.indexes.map((idx) => idx.config.name);
            expect(indexNames).toContain("wishlist_categories_user_id_idx");
            expect(indexNames).toContain(
                "wishlist_categories_user_id_name_unique",
            );
        });

        it("has expected columns", () => {
            const config = getTableConfig(wishlistCategories);
            const columnNames = config.columns.map((c) => c.name);
            expect(columnNames).toContain("id");
            expect(columnNames).toContain("user_id");
            expect(columnNames).toContain("name");
            expect(columnNames).toContain("color");
            expect(columnNames).toContain("created_at");
            expect(columnNames).toContain("updated_at");
        });

        it("has a nullable color column", () => {
            const config = getTableConfig(wishlistCategories);
            const colorCol = config.columns.find((c) => c.name === "color");
            expect(colorCol).toBeDefined();
            expect(colorCol?.notNull).toBe(false);
        });

        it("has not-null user_id and name columns", () => {
            const config = getTableConfig(wishlistCategories);
            const userIdCol = config.columns.find((c) => c.name === "user_id");
            const nameCol = config.columns.find((c) => c.name === "name");
            expect(userIdCol?.notNull).toBe(true);
            expect(nameCol?.notNull).toBe(true);
        });
    });

    describe("wishlistItems table", () => {
        it("has correct table name", () => {
            const config = getTableConfig(wishlistItems);
            expect(config.name).toBe("wishlist_items");
        });

        it("defines user_id index via index callback", () => {
            const config = getTableConfig(wishlistItems);
            expect(config.indexes.length).toBeGreaterThanOrEqual(1);
            const indexNames = config.indexes.map((idx) => idx.config.name);
            expect(indexNames).toContain("wishlist_items_user_id_idx");
        });

        it("has expected columns including optional ones", () => {
            const config = getTableConfig(wishlistItems);
            const columnNames = config.columns.map((c) => c.name);
            expect(columnNames).toContain("id");
            expect(columnNames).toContain("user_id");
            expect(columnNames).toContain("category_id");
            expect(columnNames).toContain("title");
            expect(columnNames).toContain("description");
            expect(columnNames).toContain("favicon");
            expect(columnNames).toContain("created_at");
            expect(columnNames).toContain("updated_at");
        });

        it("has a nullable category_id (foreign key to wishlistCategories)", () => {
            const config = getTableConfig(wishlistItems);
            const categoryIdCol = config.columns.find(
                (c) => c.name === "category_id",
            );
            expect(categoryIdCol).toBeDefined();
            expect(categoryIdCol?.notNull).toBe(false);
        });

        it("has foreign key relation to wishlistCategories", () => {
            const config = getTableConfig(wishlistItems);
            expect(config.foreignKeys.length).toBeGreaterThanOrEqual(1);
            // Calling fk.reference() exercises the `() => wishlistCategories.id` lambda
            const fk = config.foreignKeys.find((fk) => {
                const ref = fk.reference();
                return ref.columns.some((c) => c.name === "category_id");
            });
            expect(fk).toBeDefined();
        });
    });

    describe("wishlistItemLinks table", () => {
        it("has correct table name", () => {
            const config = getTableConfig(wishlistItemLinks);
            expect(config.name).toBe("wishlist_item_links");
        });

        it("defines item_id and normalized_url indexes via index callback", () => {
            const config = getTableConfig(wishlistItemLinks);
            expect(config.indexes.length).toBeGreaterThanOrEqual(1);
            const indexNames = config.indexes.map((idx) => idx.config.name);
            expect(indexNames).toContain("wishlist_item_links_item_id_idx");
            expect(indexNames).toContain(
                "wishlist_item_links_normalized_url_idx",
            );
        });

        it("has expected columns", () => {
            const config = getTableConfig(wishlistItemLinks);
            const columnNames = config.columns.map((c) => c.name);
            expect(columnNames).toContain("id");
            expect(columnNames).toContain("item_id");
            expect(columnNames).toContain("url");
            expect(columnNames).toContain("normalized_url");
            expect(columnNames).toContain("description");
            expect(columnNames).toContain("is_primary");
            expect(columnNames).toContain("created_at");
            expect(columnNames).toContain("updated_at");
        });

        it("has is_primary defaulting to false", () => {
            const config = getTableConfig(wishlistItemLinks);
            const isPrimaryCol = config.columns.find(
                (c) => c.name === "is_primary",
            );
            expect(isPrimaryCol).toBeDefined();
            expect(isPrimaryCol?.default).toBe(false);
        });

        it("has a not-null item_id with cascade delete foreign key", () => {
            const config = getTableConfig(wishlistItemLinks);
            const itemIdCol = config.columns.find((c) => c.name === "item_id");
            expect(itemIdCol?.notNull).toBe(true);
            // Foreign key referencing wishlistItems.id
            const fk = config.foreignKeys.find((fk) => {
                const ref = fk.reference();
                return ref.columns.some((c) => c.name === "item_id");
            });
            expect(fk).toBeDefined();
        });
    });
});
