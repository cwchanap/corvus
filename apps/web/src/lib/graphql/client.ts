/**
 * GraphQL client utilities for making requests to the API
 */

const GRAPHQL_ENDPOINT =
  (import.meta.env.VITE_API_URL as string | undefined) ||
  "http://localhost:8787/graphql";

export interface GraphQLResponse<T> {
  data?: T;
  errors?: Array<{
    message: string;
    extensions?: Record<string, unknown>;
  }>;
}

/**
 * Make a GraphQL request
 * Automatically includes credentials for session cookies
 */
export async function graphqlRequest<T>(
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include", // Important: send cookies for session
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
    // Throw the first GraphQL error
    const error = json.errors[0]!;
    throw new Error(error.message);
  }

  if (!json.data) {
    throw new Error("No data returned from GraphQL query");
  }

  return json.data;
}
