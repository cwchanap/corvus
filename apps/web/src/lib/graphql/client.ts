/**
 * Web app GraphQL client configuration
 * Uses shared utilities from @repo/common
 */

import {
    graphqlRequest as baseGraphqlRequest,
    type GraphQLClientOptions,
} from "@repo/common/graphql/client";

const GRAPHQL_ENDPOINT =
    (import.meta.env.VITE_API_URL as string | undefined) ||
    (["development", "test"].includes(import.meta.env.MODE)
        ? "http://localhost:5002/graphql"
        : "/graphql");

export function getGoogleAuthStartUrl(): string {
    // In the browser, always use the current page origin so the OAuth flow
    // stays on the web-app origin.  In development the Vite dev server proxies
    // /auth/* to the API; in production the API Worker serves both.
    // SSR / test contexts that lack `window` fall back to deriving the origin
    // from the configured GraphQL endpoint.
    const authOrigin =
        typeof window === "undefined"
            ? new URL(GRAPHQL_ENDPOINT, "http://localhost:5002").origin
            : window.location.origin;
    const authUrl = new URL("/auth/google/start", authOrigin);
    if (typeof window !== "undefined") {
        const source = new URLSearchParams(window.location.search).get(
            "source",
        );
        if (source === "extension") {
            authUrl.searchParams.set("source", source);
        }
    }
    return authUrl.toString();
}

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
