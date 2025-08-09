import type { Kysely } from "kysely";
import type { Database } from "./types";
import { randomUUID } from "node:crypto";

export async function runMigrations(db: Kysely<Database>) {
  try {
    // Create users table
    await db.schema
      .createTable("users")
      .ifNotExists()
      .addColumn("id", "integer", (col) => col.primaryKey().autoIncrement())
      .addColumn("email", "text", (col) => col.notNull().unique())
      .addColumn("password_hash", "text", (col) => col.notNull())
      .addColumn("name", "text", (col) => col.notNull())
      .addColumn("created_at", "text", (col) =>
        col.notNull().defaultTo("CURRENT_TIMESTAMP"),
      )
      .addColumn("updated_at", "text", (col) =>
        col.notNull().defaultTo("CURRENT_TIMESTAMP"),
      )
      .execute();

    // Create sessions table
    await db.schema
      .createTable("sessions")
      .ifNotExists()
      .addColumn("id", "text", (col) => col.primaryKey())
      .addColumn("user_id", "integer", (col) =>
        col.notNull().references("users.id").onDelete("cascade"),
      )
      .addColumn("expires_at", "text", (col) => col.notNull())
      .addColumn("created_at", "text", (col) =>
        col.notNull().defaultTo("CURRENT_TIMESTAMP"),
      )
      .execute();

    // Create indexes
    await db.schema
      .createIndex("idx_users_email")
      .ifNotExists()
      .on("users")
      .column("email")
      .execute();

    await db.schema
      .createIndex("idx_sessions_user_id")
      .ifNotExists()
      .on("sessions")
      .column("user_id")
      .execute();

    await db.schema
      .createIndex("idx_sessions_expires_at")
      .ifNotExists()
      .on("sessions")
      .column("expires_at")
      .execute();

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

    console.log("All tables created successfully");
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
        id: randomUUID(),
        user_id: userId,
        ...category,
      })
      .execute();
  }
}
