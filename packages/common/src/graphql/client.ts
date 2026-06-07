/**
 * Shared GraphQL client utilities
 * Framework-agnostic, can be used in both web and extension
 */

export interface GraphQLClientOptions {
    endpoint: string;
    credentials?: RequestCredentials;
    fetchImpl?: typeof fetch;
}

export interface GraphQLResponse<T> {
    data?: T;
    errors?: Array<{
        message: string;
        extensions?: Record<string, unknown>;
    }>;
}

/**
 * Options for constructing a {@link GraphQLError}.
 *
 * Extends the standard `ErrorOptions` so the `cause` field is forwarded to the
 * underlying `Error`, while `status` and `code` carry structured request
 * metadata.
 */
export interface GraphQLErrorOptions extends ErrorOptions {
    /** HTTP status code when this error originates from a non-2xx response. */
    status?: number;
    /** GraphQL error extension `code` (e.g. "UNAUTHENTICATED"). */
    code?: string;
}

/**
 * Structured error thrown by {@link graphqlRequest}.
 *
 * Carries the HTTP `status` (for transport-level failures) and/or the GraphQL
 * extension `code` (for resolver-level failures), so callers can branch on
 * typed fields instead of substring-matching the message. The standard
 * `message` is preserved for backwards compatibility and human-readable logs.
 */
export class GraphQLError extends Error {
    readonly status?: number;
    readonly code?: string;

    constructor(message: string, options?: GraphQLErrorOptions) {
        super(message, options);
        this.name = "GraphQLError";
        this.status = options?.status;
        this.code = options?.code;
    }
}

/**
 * Returns `true` when `error` represents an authentication/authorization
 * failure — either an HTTP 401/403 transport error or a resolver-level
 * "UNAUTHENTICATED" / "UNAUTHORIZED" GraphQL extension code.
 *
 * Prefer this over message substring matching, which is fragile across
 * resolver implementations.
 */
export function isAuthError(error: unknown): boolean {
    if (error instanceof GraphQLError) {
        return (
            error.status === 401 ||
            error.status === 403 ||
            error.code === "UNAUTHENTICATED" ||
            error.code === "UNAUTHORIZED"
        );
    }
    return false;
}

/**
 * Make a GraphQL request
 * @param query GraphQL query/mutation string
 * @param variables Optional variables
 * @param options Client configuration
 */
export async function graphqlRequest<T>(
    query: string,
    variables?: Record<string, unknown>,
    options?: Partial<GraphQLClientOptions>,
): Promise<T> {
    const {
        endpoint = "http://localhost:8787/graphql",
        credentials = "include",
        fetchImpl = fetch,
    } = options || {};

    const response = await fetchImpl(endpoint, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        credentials,
        body: JSON.stringify({
            query,
            variables,
        }),
    });

    if (!response.ok) {
        throw new GraphQLError(`HTTP error! status: ${response.status}`, {
            status: response.status,
        });
    }

    const json: GraphQLResponse<T> = await response.json();

    if (json.errors && json.errors.length > 0) {
        const error = json.errors[0]!;
        const rawCode = error.extensions?.code;
        const code = typeof rawCode === "string" ? rawCode : undefined;
        throw new GraphQLError(error.message, { code });
    }

    if (!json.data) {
        throw new GraphQLError("No data returned from GraphQL query");
    }

    return json.data;
}
