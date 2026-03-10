import { sqliteTable, integer, text, index } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const wishlistCategories = sqliteTable(
    "wishlist_categories",
    {
        id: text("id").primaryKey(),
        user_id: text("user_id").notNull(),
        name: text("name").notNull(),
        color: text("color"),
        created_at: text("created_at")
            .notNull()
            .default(sql`CURRENT_TIMESTAMP`),
        updated_at: text("updated_at")
            .notNull()
            .default(sql`CURRENT_TIMESTAMP`),
    },
    (table) => ({
        userIdIdx: index("wishlist_categories_user_id_idx").on(table.user_id),
    }),
);

export const wishlistItems = sqliteTable(
    "wishlist_items",
    {
        id: text("id").primaryKey(),
        user_id: text("user_id").notNull(),
        category_id: text("category_id").references(
            () => wishlistCategories.id,
            {
                onDelete: "set null",
            },
        ),
        title: text("title").notNull(),
        description: text("description"),
        favicon: text("favicon"),
        created_at: text("created_at")
            .notNull()
            .default(sql`CURRENT_TIMESTAMP`),
        updated_at: text("updated_at")
            .notNull()
            .default(sql`CURRENT_TIMESTAMP`),
    },
    (table) => ({
        userIdIdx: index("wishlist_items_user_id_idx").on(table.user_id),
    }),
);

export const wishlistItemLinks = sqliteTable("wishlist_item_links", {
    id: text("id").primaryKey(),
    item_id: text("item_id")
        .notNull()
        .references(() => wishlistItems.id, {
            onDelete: "cascade",
        }),
    url: text("url").notNull(),
    description: text("description"),
    is_primary: integer("is_primary", { mode: "boolean" })
        .notNull()
        .default(false),
    created_at: text("created_at")
        .notNull()
        .default(sql`CURRENT_TIMESTAMP`),
    updated_at: text("updated_at")
        .notNull()
        .default(sql`CURRENT_TIMESTAMP`),
});
