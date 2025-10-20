/**
 * Extension auth operations
 * Uses shared query strings from @repo/common with extension-specific client
 */

import {
  ME_QUERY,
  REGISTER_MUTATION,
  LOGIN_MUTATION,
  LOGOUT_MUTATION,
} from "@repo/common/graphql/operations/auth";
import { graphqlRequest } from "./client.js";

// Re-export shared types
export type {
  GraphQLUser as User,
  AuthPayload,
  LoginInput,
  RegisterInput,
} from "@repo/common/graphql/types";

/**
 * Get current user
 */
export async function getCurrentUser() {
  const data = await graphqlRequest<{
    me: import("@repo/common/graphql/types").GraphQLUser | null;
  }>(ME_QUERY);
  return data.me;
}

/**
 * Register new user
 */
export async function register(
  input: import("@repo/common/graphql/types").RegisterInput,
) {
  const data = await graphqlRequest<{
    register: import("@repo/common/graphql/types").AuthPayload;
  }>(REGISTER_MUTATION, { input });
  return data.register;
}

/**
 * Login user
 */
export async function login(
  input: import("@repo/common/graphql/types").LoginInput,
) {
  const data = await graphqlRequest<{
    login: import("@repo/common/graphql/types").AuthPayload;
  }>(LOGIN_MUTATION, { input });
  return data.login;
}

/**
 * Logout user
 */
export async function logout() {
  const data = await graphqlRequest<{ logout: boolean }>(LOGOUT_MUTATION);
  return data.logout;
}
