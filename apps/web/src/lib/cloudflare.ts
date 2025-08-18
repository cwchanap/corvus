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

export function getD1(): D1Database | undefined {
  const event = getRequestEvent() as unknown as CloudflareEvent | undefined;
  const db = event?.nativeEvent?.context?.cloudflare?.env?.DB;
  if (!db) {
    if (process.env.NODE_ENV !== "production") {
      // Allow callers to fall back to mock DB in development
      return undefined;
    }
    throw new Error(
      "D1 database binding is missing. Ensure Cloudflare env.DB is configured in wrangler.toml and available in the request context.",
    );
  }
  return db;
}
