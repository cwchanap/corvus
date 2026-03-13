import type { Context } from "hono";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { DB } from "../lib/db";
import type { PublicUser } from "../lib/db/types";
import { createDatabase } from "../lib/db";
import { createSupabaseServerClient } from "../lib/auth/supabase-client";
import { SupabaseAuthService } from "../lib/auth/service";
import { getD1 } from "../lib/cloudflare";

export interface GraphQLContext {
    db: DB;
    user: PublicUser | null;
    supabase: SupabaseClient;
    request: Request;
    honoContext: Context;
}

/**
 * Create GraphQL context from Hono context.
 * Validates the Supabase session cookie and injects DB and user.
 * The Supabase client is created once per request and shared with resolvers
 * so that cookie state is accumulated on a single instance.
 */
export async function createGraphQLContext(
    c: Context,
): Promise<GraphQLContext> {
    const db = createDatabase(getD1(c));
    const supabase = createSupabaseServerClient(c);
    const authService = new SupabaseAuthService(supabase, db);
    const user = await authService.getUser().catch((err) => {
        console.error(
            "[createGraphQLContext] Failed to resolve user from session:",
            err,
        );
        throw err;
    });

    return {
        db,
        user,
        supabase,
        request: c.req.raw,
        honoContext: c,
    };
}
