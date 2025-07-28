import { Kysely, SqliteDialect } from "kysely";
import Database from "better-sqlite3";
import type { Database as DatabaseSchema } from "./db/types";

export function createDatabase(d1Database?: any): Kysely<DatabaseSchema> {
  if (d1Database) {
    // For Cloudflare D1 in production
    // This would need a D1 dialect, but for now we'll use SQLite
    console.warn("D1 database not fully implemented, falling back to SQLite");
  }

  // For local development, use SQLite
  const sqlite = new Database("corvus.db");
  sqlite.pragma("journal_mode = WAL");

  return new Kysely<DatabaseSchema>({
    dialect: new SqliteDialect({
      database: sqlite,
    }),
  });
}
