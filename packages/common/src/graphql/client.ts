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
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const json: GraphQLResponse<T> = await response.json();

  if (json.errors && json.errors.length > 0) {
    const error = json.errors[0]!;
    throw new Error(error.message);
  }

  if (!json.data) {
    throw new Error("No data returned from GraphQL query");
  }

  return json.data;
}
