/**
 * Extension GraphQL client configuration
 * Uses shared utilities from @repo/common
 */

import {
  graphqlRequest as baseGraphqlRequest,
  type GraphQLClientOptions,
} from "@repo/common/graphql/client";

// Use VITE_API_BASE (same as REST client) and append /graphql
const API_BASE =
  (import.meta.env.VITE_API_BASE as string | undefined) ||
  (import.meta.env.MODE === "development" ? "http://localhost:8787" : "");

const GRAPHQL_ENDPOINT = API_BASE
  ? `${API_BASE}/graphql`
  : "http://localhost:8787/graphql";

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
