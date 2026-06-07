/**
 * Extension GraphQL client configuration
 * Uses shared utilities from @repo/common
 */

import {
    graphqlRequest as baseGraphqlRequest,
    type GraphQLClientOptions,
} from "@repo/common/graphql/client";

const PROD_API_BASE = "https://corvus.cwchanap.dev";

// Use VITE_API_BASE (same as REST client) and append /graphql.
// Dev fallback must match the API dev port (wrangler.jsonc dev.port = 5002).
const API_BASE =
    (import.meta.env.VITE_API_BASE as string | undefined) ||
    (import.meta.env.MODE === "development"
        ? "http://localhost:5002"
        : PROD_API_BASE);

const GRAPHQL_ENDPOINT = `${API_BASE}/graphql`;

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

// Re-export types
export type { GraphQLClientOptions } from "@repo/common/graphql/client";
