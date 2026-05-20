/**
 * Shared GraphQL auth operations
 * Can be used in both web app and extension
 */

import { graphqlRequest, type GraphQLClientOptions } from "../client";
import type { GraphQLUser } from "../types";

// Query strings
export const ME_QUERY = `
  query Me {
    me {
      id
      email
      name
      createdAt
      updatedAt
    }
  }
`;

export const LOGOUT_MUTATION = `
  mutation Logout {
    logout
  }
`;

// Operation functions
export async function getCurrentUser(
    options?: Partial<GraphQLClientOptions>,
): Promise<GraphQLUser | null> {
    const data = await graphqlRequest<{ me: GraphQLUser | null }>(
        ME_QUERY,
        undefined,
        options,
    );
    return data.me;
}

export async function logout(
    options?: Partial<GraphQLClientOptions>,
): Promise<boolean> {
    const data = await graphqlRequest<{ logout: boolean }>(
        LOGOUT_MUTATION,
        undefined,
        options,
    );
    return data.logout;
}
