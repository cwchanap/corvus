import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  password_hash: text("password_hash").notNull(),
  name: text("name").notNull(),
  created_at: text("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updated_at: text("updated_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(),
  user_id: integer("user_id")
    .notNull()
    .references(() => users.id, {
      onDelete: "cascade",
    }),
  expires_at: text("expires_at").notNull(),
  created_at: text("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const wishlistCategories = sqliteTable("wishlist_categories", {
  id: text("id").primaryKey(),
  user_id: integer("user_id")
    .notNull()
    .references(() => users.id, {
      onDelete: "cascade",
    }),
  name: text("name").notNull(),
  color: text("color"),
  created_at: text("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updated_at: text("updated_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const wishlistItems = sqliteTable("wishlist_items", {
  id: text("id").primaryKey(),
  user_id: integer("user_id")
    .notNull()
    .references(() => users.id, {
      onDelete: "cascade",
    }),
  category_id: text("category_id")
    .notNull()
    .references(() => wishlistCategories.id, {
      onDelete: "cascade",
    }),
  title: text("title").notNull(),
  url: text("url").notNull(),
  description: text("description"),
  favicon: text("favicon"),
  created_at: text("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updated_at: text("updated_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});
