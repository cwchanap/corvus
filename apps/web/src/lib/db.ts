import type { Kysely } from "kysely";
import type { D1Database } from "@cloudflare/workers-types";
import type { Database as DatabaseSchema } from "./db/types.js";
import { createD1Kysely } from "./db/d1.js";

export function createDatabase(d1Database: D1Database): Kysely<DatabaseSchema> {
  return createD1Kysely(d1Database);
}
