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

  // Fallback for development: create a mock D1 database
  // This allows the app to run locally without Cloudflare environment
  console.warn(
    "D1 binding not found. Using mock database for local development.",
  );
  console.warn("Make sure to run: cd apps/api && npx wrangler dev");

  // Create a simple mock D1Database that throws an error for all operations
  // This allows the app to start but will show appropriate error messages
  const mockDb = {
    prepare: () => ({
      bind: () => ({
        run: () =>
          Promise.reject(
            new Error(
              "Mock database: Please run 'cd apps/api && npx wrangler dev' to start the API server with D1 database",
            ),
          ),
        all: () =>
          Promise.reject(
            new Error(
              "Mock database: Please run 'cd apps/api && npx wrangler dev' to start the API server with D1 database",
            ),
          ),
        first: () =>
          Promise.reject(
            new Error(
              "Mock database: Please run 'cd apps/api && npx wrangler dev' to start the API server with D1 database",
            ),
          ),
        raw: () =>
          Promise.reject(
            new Error(
              "Mock database: Please run 'cd apps/api && npx wrangler dev' to start the API server with D1 database",
            ),
          ),
      }),
      run: () =>
        Promise.reject(
          new Error(
            "Mock database: Please run 'cd apps/api && npx wrangler dev' to start the API server with D1 database",
          ),
        ),
      all: () =>
        Promise.reject(
          new Error(
            "Mock database: Please run 'cd apps/api && npx wrangler dev' to start the API server with D1 database",
          ),
        ),
      first: () =>
        Promise.reject(
          new Error(
            "Mock database: Please run 'cd apps/api && npx wrangler dev' to start the API server with D1 database",
          ),
        ),
      raw: () =>
        Promise.reject(
          new Error(
            "Mock database: Please run 'cd apps/api && npx wrangler dev' to start the API server with D1 database",
          ),
        ),
    }),
    batch: () =>
      Promise.reject(
        new Error(
          "Mock database: Please run 'cd apps/api && npx wrangler dev' to start the API server with D1 database",
        ),
      ),
    exec: () =>
      Promise.reject(
        new Error(
          "Mock database: Please run 'cd apps/api && npx wrangler dev' to start the API server with D1 database",
        ),
      ),
  } as unknown as D1Database;

  return mockDb;
}
