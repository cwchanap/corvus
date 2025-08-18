import type { Kysely } from "kysely";
import type { D1Database } from "@cloudflare/workers-types";
import type { Database as DatabaseSchema } from "./db/types.js";
import { createD1Kysely } from "./db/d1.js";
import { createMockDatabase } from "./db/mock.js";

// Persist across dev server reloads
const g = globalThis as unknown as {
  __CORVUS_MOCK_DB?: Kysely<DatabaseSchema>;
};

export function createDatabase(
  d1Database?: D1Database,
): Kysely<DatabaseSchema> {
  if (!d1Database) {
    if (process.env.NODE_ENV !== "production") {
      // Prefer global cache if present (survives HMR)
      if (!g.__CORVUS_MOCK_DB) {
        g.__CORVUS_MOCK_DB = createMockDatabase();
      }
      return g.__CORVUS_MOCK_DB;
    }
    throw new Error(
      "D1 database binding is required. Ensure Cloudflare env.DB is available.",
    );
  }

  return createD1Kysely(d1Database);
}
