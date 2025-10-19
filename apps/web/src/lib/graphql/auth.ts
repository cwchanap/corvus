/**
 * GraphQL queries and mutations for authentication
 */

import { graphqlRequest } from "./client.js";

// Types matching GraphQL schema
export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthPayload {
  success: boolean;
  user: User | null;
  error: string | null;
}

// Queries
const ME_QUERY = `
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

export async function getCurrentUser(): Promise<User | null> {
  const data = await graphqlRequest<{ me: User | null }>(ME_QUERY);
  return data.me;
}

// Mutations
const REGISTER_MUTATION = `
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

export interface RegisterInput {
  email: string;
  password: string;
  name: string;
}

export async function register(input: RegisterInput): Promise<AuthPayload> {
  const data = await graphqlRequest<{ register: AuthPayload }>(
    REGISTER_MUTATION,
    { input },
  );
  return data.register;
}

const LOGIN_MUTATION = `
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

export interface LoginInput {
  email: string;
  password: string;
}

export async function login(input: LoginInput): Promise<AuthPayload> {
  const data = await graphqlRequest<{ login: AuthPayload }>(LOGIN_MUTATION, {
    input,
  });
  return data.login;
}

const LOGOUT_MUTATION = `
  mutation Logout {
    logout
  }
`;

export async function logout(): Promise<boolean> {
  const data = await graphqlRequest<{ logout: boolean }>(LOGOUT_MUTATION);
  return data.logout;
}
