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

    console.log("Database initialized successfully");
  } catch (error) {
    console.error("Error initializing database:", error);
    throw error;
  }
}

// Initialize database on module load
initializeDatabase();
