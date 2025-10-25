/**
 * Web app GraphQL client configuration
 * Uses shared utilities from @repo/common
 */

import {
  graphqlRequest as baseGraphqlRequest,
  type GraphQLClientOptions,
} from "@repo/common/graphql/client";

const GRAPHQL_ENDPOINT =
  // eslint-disable-next-line turbo/no-undeclared-env-vars
  (import.meta.env.VITE_API_URL as string | undefined) ||
  "http://localhost:5002/graphql";

/**
 * Pre-configured GraphQL request function for the web app
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
export type {
  GraphQLClientOptions,
  GraphQLResponse,
} from "@repo/common/graphql/client";
