import type { Context } from "hono";
import type { DB } from "../lib/db";
import type { PublicUser } from "../lib/db/types";
import { createDatabase } from "../lib/db";
import { AuthService } from "../lib/auth/service";
import { getSessionCookie } from "../lib/auth/session";
import { getD1 } from "../lib/cloudflare";

export interface GraphQLContext {
  db: DB;
  user: PublicUser | null;
  request: Request;
  honoContext: Context;
}

/**
 * Create GraphQL context from Hono context
 * Extracts session cookie, validates it, and injects DB and user
 */
export async function createGraphQLContext(
  c: Context,
): Promise<GraphQLContext> {
  const db = createDatabase(getD1(c));
  const sessionId = getSessionCookie(c);

  let user: PublicUser | null = null;

  if (sessionId) {
    const authService = new AuthService(db);
    user = await authService.validateSession(sessionId);
  }

  return {
    db,
    user,
    request: c.req.raw,
    honoContext: c,
  };
}
