/**
 * Shared GraphQL auth operations
 * Can be used in both web app and extension
 */

import { graphqlRequest, type GraphQLClientOptions } from "../client.js";
import type {
  GraphQLUser,
  AuthPayload,
  RegisterInput,
  LoginInput,
} from "../types.js";

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

export const REGISTER_MUTATION = `
  mutation Register($input: RegisterInput!) {
    register(input: $input) {
      success
      user {
        id
        email
        name
        createdAt
        updatedAt
      }
      error
    }
  }
`;

export const LOGIN_MUTATION = `
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      success
      user {
        id
        email
        name
        createdAt
        updatedAt
      }
      error
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

export async function register(
  input: RegisterInput,
  options?: Partial<GraphQLClientOptions>,
): Promise<AuthPayload> {
  const data = await graphqlRequest<{ register: AuthPayload }>(
    REGISTER_MUTATION,
    { input },
    options,
  );
  return data.register;
}

export async function login(
  input: LoginInput,
  options?: Partial<GraphQLClientOptions>,
): Promise<AuthPayload> {
  const data = await graphqlRequest<{ login: AuthPayload }>(
    LOGIN_MUTATION,
    { input },
    options,
  );
  return data.login;
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
