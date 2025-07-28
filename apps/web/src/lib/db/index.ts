import { Kysely, SqliteDialect } from "kysely";
import Database from "better-sqlite3";
import type { Database as DatabaseSchema } from "./schema.js";

// Create database connection
const sqlite = new Database("corvus.db");

// Enable WAL mode for better performance
sqlite.pragma("journal_mode = WAL");

export const db = new Kysely<DatabaseSchema>({
  dialect: new SqliteDialect({
    database: sqlite,
  }),
});

// Initialize database with tables
export async function initializeDatabase() {
  try {
    // Create users table
    await db.schema
      .createTable("users")
      .ifNotExists()
      .addColumn("id", "text", (col) => col.primaryKey())
      .addColumn("name", "text", (col) => col.notNull())
      .addColumn("email", "text", (col) => col.notNull().unique())
      .addColumn("email_verified", "boolean", (col) =>
        col.notNull().defaultTo(false),
      )
      .addColumn("image", "text")
      .addColumn("created_at", "datetime", (col) =>
        col.notNull().defaultTo("CURRENT_TIMESTAMP"),
      )
      .addColumn("updated_at", "datetime", (col) =>
        col.notNull().defaultTo("CURRENT_TIMESTAMP"),
      )
      .execute();

    // Create sessions table
    await db.schema
      .createTable("sessions")
      .ifNotExists()
      .addColumn("id", "text", (col) => col.primaryKey())
      .addColumn("user_id", "text", (col) =>
        col.notNull().references("users.id").onDelete("cascade"),
      )
      .addColumn("expires_at", "datetime", (col) => col.notNull())
      .addColumn("token", "text", (col) => col.notNull().unique())
      .addColumn("created_at", "datetime", (col) =>
        col.notNull().defaultTo("CURRENT_TIMESTAMP"),
      )
      .addColumn("updated_at", "datetime", (col) =>
        col.notNull().defaultTo("CURRENT_TIMESTAMP"),
      )
      .execute();

    // Create wishlist_categories table
    await db.schema
      .createTable("wishlist_categories")
      .ifNotExists()
      .addColumn("id", "text", (col) => col.primaryKey())
      .addColumn("user_id", "text", (col) =>
        col.notNull().references("users.id").onDelete("cascade"),
      )
      .addColumn("name", "text", (col) => col.notNull())
      .addColumn("color", "text")
      .addColumn("created_at", "datetime", (col) =>
        col.notNull().defaultTo("CURRENT_TIMESTAMP"),
      )
      .addColumn("updated_at", "datetime", (col) =>
        col.notNull().defaultTo("CURRENT_TIMESTAMP"),
      )
      .execute();

    // Create wishlist_items table
    await db.schema
      .createTable("wishlist_items")
      .ifNotExists()
      .addColumn("id", "text", (col) => col.primaryKey())
      .addColumn("user_id", "text", (col) =>
        col.notNull().references("users.id").onDelete("cascade"),
      )
      .addColumn("category_id", "text", (col) =>
        col.notNull().references("wishlist_categories.id").onDelete("cascade"),
      )
      .addColumn("title", "text", (col) => col.notNull())
      .addColumn("url", "text", (col) => col.notNull())
      .addColumn("description", "text")
      .addColumn("favicon", "text")
      .addColumn("created_at", "datetime", (col) =>
        col.notNull().defaultTo("CURRENT_TIMESTAMP"),
      )
      .addColumn("updated_at", "datetime", (col) =>
        col.notNull().defaultTo("CURRENT_TIMESTAMP"),
      )
      .execute();

    console.log("Database initialized successfully");
  } catch (error) {
    console.error("Error initializing database:", error);
    throw error;
  }
}
