import type { Context } from "hono";
import type { DB } from "../lib/db";
import type { PublicUser } from "../lib/db/types";
import { createDatabase } from "../lib/db";
import { GoogleAuthService } from "../lib/auth/service";
import { createD1AuthStore } from "../lib/auth/store";
import { SESSION_COOKIE_NAME, readCookie } from "../lib/auth/cookies";
import { getD1 } from "../lib/cloudflare";

export interface GraphQLContext {
    db: DB;
    user: PublicUser | null;
    authService: GoogleAuthService;
    sessionId: string | null;
    request: Request;
    honoContext: Context;
}

/**
 * Create GraphQL context from Hono context.
 * Resolves the Corvus-owned session cookie and injects DB and user.
 */
export async function createGraphQLContext(
    c: Context,
): Promise<GraphQLContext> {
    const db = createDatabase(getD1(c));
    const authService = new GoogleAuthService(createD1AuthStore(db), c.env);
    const sessionId = readCookie(c.req.header("cookie"), SESSION_COOKIE_NAME);
    const user = await authService.getUser(sessionId).catch((err) => {
        console.error(
            "[createGraphQLContext] Failed to resolve user from session:",
            err,
        );
        throw err;
    });

    return {
        db,
        user,
        authService,
        sessionId,
        request: c.req.raw,
        honoContext: c,
    };
}
