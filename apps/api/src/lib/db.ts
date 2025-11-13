import type { D1Database } from "@cloudflare/workers-types";
import { drizzle, type DrizzleD1Database } from "drizzle-orm/d1";
import * as schema from "./db/schema";

export type DB = DrizzleD1Database<typeof schema>;

export function createDatabase(d1Database: D1Database): DB {
  return drizzle(d1Database, { schema });
}
