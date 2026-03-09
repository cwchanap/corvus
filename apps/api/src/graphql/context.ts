import type { Context } from "hono";
import type { DB } from "../lib/db";
import type { PublicUser } from "../lib/db/types";
import { createDatabase } from "../lib/db";
import { createSupabaseServerClient } from "../lib/auth/supabase-client";
import { SupabaseAuthService } from "../lib/auth/service";
import { getD1 } from "../lib/cloudflare";

export interface GraphQLContext {
    db: DB;
    user: PublicUser | null;
    request: Request;
    honoContext: Context;
}

/**
 * Create GraphQL context from Hono context.
 * Validates the Supabase session cookie and injects DB and user.
 */
export async function createGraphQLContext(
    c: Context,
): Promise<GraphQLContext> {
    const db = createDatabase(getD1(c));
    const supabase = createSupabaseServerClient(c);
    const authService = new SupabaseAuthService(supabase, db);
    const user = await authService.getUser();

    return {
        db,
        user,
        request: c.req.raw,
        honoContext: c,
    };
}
