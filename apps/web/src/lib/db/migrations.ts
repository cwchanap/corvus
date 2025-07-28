import type { Kysely } from "kysely";
import type { Database } from "./types";

export async function runMigrations(db: Kysely<Database>) {
  try {
    // Create wishlist_categories table
    await db.schema
      .createTable("wishlist_categories")
      .ifNotExists()
      .addColumn("id", "text", (col) => col.primaryKey())
      .addColumn("user_id", "integer", (col) =>
        col.notNull().references("users.id").onDelete("cascade"),
      )
      .addColumn("name", "text", (col) => col.notNull())
      .addColumn("color", "text")
      .addColumn("created_at", "text", (col) =>
        col.notNull().defaultTo("CURRENT_TIMESTAMP"),
      )
      .addColumn("updated_at", "text", (col) =>
        col.notNull().defaultTo("CURRENT_TIMESTAMP"),
      )
      .execute();

    // Create wishlist_items table
    await db.schema
      .createTable("wishlist_items")
      .ifNotExists()
      .addColumn("id", "text", (col) => col.primaryKey())
      .addColumn("user_id", "integer", (col) =>
        col.notNull().references("users.id").onDelete("cascade"),
      )
      .addColumn("category_id", "text", (col) =>
        col.notNull().references("wishlist_categories.id").onDelete("cascade"),
      )
      .addColumn("title", "text", (col) => col.notNull())
      .addColumn("url", "text", (col) => col.notNull())
      .addColumn("description", "text")
      .addColumn("favicon", "text")
      .addColumn("created_at", "text", (col) =>
        col.notNull().defaultTo("CURRENT_TIMESTAMP"),
      )
      .addColumn("updated_at", "text", (col) =>
        col.notNull().defaultTo("CURRENT_TIMESTAMP"),
      )
      .execute();

    console.log("Wishlist tables created successfully");
  } catch (error) {
    console.error("Error running migrations:", error);
    throw error;
  }
}

export async function createDefaultCategories(
  db: Kysely<Database>,
  userId: number,
) {
  const defaultCategories = [
    { name: "General", color: "#6366f1" },
    { name: "Work", color: "#059669" },
    { name: "Personal", color: "#dc2626" },
  ];

  for (const category of defaultCategories) {
    await db
      .insertInto("wishlist_categories")
      .values({
        id: crypto.randomUUID(),
        user_id: userId,
        ...category,
      })
      .execute();
  }
}
