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

  // Fallback for development: throw error with clear instructions
  throw new Error(
    'D1 binding missing. Ensure wrangler.toml has [[d1_databases]] with binding="DB" and run the app with Cloudflare env available (e.g. `wrangler dev`, or appropriate SolidStart/adapter that injects cloudflare.env).',
  );
}
