/**
 * Extension GraphQL client configuration
 * Uses shared utilities from @repo/common
 */

import {
    graphqlRequest as baseGraphqlRequest,
    type GraphQLClientOptions,
} from "@repo/common/graphql/client";

const DEV_API_BASE = "http://localhost:5002";
const PROD_API_BASE = "https://corvus.cwchanap.dev";

/** Shape of the env subset {@link resolveApiBase} reads. */
export interface ApiBaseEnv {
    VITE_API_BASE?: string;
    MODE?: string;
}

/**
 * Resolve the API base URL.
 *
 * - Honors `VITE_API_BASE` when set (same var as the REST client).
 * - Only targets the production host when `MODE` is explicitly
 *   `"production"`. Any other value (development, test, undefined, a typo)
 *   falls through to the dev port so an unexpected mode can never silently
 *   route traffic to production. The dev port MUST match the API dev server
 *   (`wrangler.jsonc` `dev.port`, currently 5002) — a test locks it.
 *
 * Exported so the resolution can be unit-tested in isolation.
 */
export function resolveApiBase(env: ApiBaseEnv = import.meta.env): string {
    return (
        (env.VITE_API_BASE && env.VITE_API_BASE.length > 0
            ? env.VITE_API_BASE
            : undefined) ||
        (env.MODE === "production" ? PROD_API_BASE : DEV_API_BASE)
    );
}

const GRAPHQL_ENDPOINT = `${resolveApiBase()}/graphql`;

/**
 * Pre-configured GraphQL request function for the extension
 * Automatically uses the correct endpoint and includes credentials
 */
export async function graphqlRequest<T>(
    query: string,
    variables?: Record<string, unknown>,
    options?: Partial<GraphQLClientOptions>,
): Promise<T> {
    return baseGraphqlRequest<T>(query, variables, {
        endpoint: GRAPHQL_ENDPOINT,
        credentials: "include",
        ...options,
    });
}

// Re-export types and the structured auth-error helper from the shared client
// so extension consumers depend only on the extension-local module surface.
export type { GraphQLClientOptions } from "@repo/common/graphql/client";
export { GraphQLError, isAuthError } from "@repo/common/graphql/client";
