import { getRequestEvent } from "solid-js/web";
import type { D1Database } from "@cloudflare/workers-types";

export type CloudflareEvent = {
  nativeEvent?: {
    context?: {
      cloudflare?: {
        env?: { DB: D1Database };
      };
    };
  };
};

export function getD1(): D1Database {
  const event = getRequestEvent() as unknown as CloudflareEvent | undefined;
  const db = event?.nativeEvent?.context?.cloudflare?.env?.DB;
  if (db) {
    return db;
  }

  // Fallback for development: create a mock D1 database
  // This allows the app to run locally without Cloudflare environment
  console.warn(
    "D1 binding not found. Using mock database for local development.",
  );

  // Create a simple mock D1Database that throws an error for all operations
  // This allows the app to start but will show appropriate error messages
  const mockDb = {
    prepare: () => ({
      bind: () => ({
        run: () =>
          Promise.reject(
            new Error(
              "Mock database: Please run with Cloudflare environment (pnpm dev:split)",
            ),
          ),
        all: () =>
          Promise.reject(
            new Error(
              "Mock database: Please run with Cloudflare environment (pnpm dev:split)",
            ),
          ),
        first: () =>
          Promise.reject(
            new Error(
              "Mock database: Please run with Cloudflare environment (pnpm dev:split)",
            ),
          ),
        raw: () =>
          Promise.reject(
            new Error(
              "Mock database: Please run with Cloudflare environment (pnpm dev:split)",
            ),
          ),
      }),
      run: () =>
        Promise.reject(
          new Error(
            "Mock database: Please run with Cloudflare environment (pnpm dev:split)",
          ),
        ),
      all: () =>
        Promise.reject(
          new Error(
            "Mock database: Please run with Cloudflare environment (pnpm dev:split)",
          ),
        ),
      first: () =>
        Promise.reject(
          new Error(
            "Mock database: Please run with Cloudflare environment (pnpm dev:split)",
          ),
        ),
      raw: () =>
        Promise.reject(
          new Error(
            "Mock database: Please run with Cloudflare environment (pnpm dev:split)",
          ),
        ),
    }),
    batch: () =>
      Promise.reject(
        new Error(
          "Mock database: Please run with Cloudflare environment (pnpm dev:split)",
        ),
      ),
    exec: () =>
      Promise.reject(
        new Error(
          "Mock database: Please run with Cloudflare environment (pnpm dev:split)",
        ),
      ),
  } as unknown as D1Database;

  return mockDb;
}
