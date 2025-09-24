import type { D1Database } from "@cloudflare/workers-types";
import type { Context } from "hono";

export function getD1(c?: Context): D1Database {
  const db = c?.env?.DB as D1Database | undefined;
  if (db) {
    return db;
  }

  // For local development, try to use the local D1 database
  // This will work when running with `wrangler dev` or similar
  if (typeof globalThis !== "undefined" && (globalThis as any).DB) {
    return (globalThis as any).DB;
  }

  // If no D1 binding is found, throw an error
  throw new Error(
    "D1 database binding not found. Please run 'npx wrangler dev' to start the API server with D1 database access.",
  );
}
