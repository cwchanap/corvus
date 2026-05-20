/**
 * Web app auth operations
 * Uses shared query strings from @repo/common with app-specific client
 */

import {
    ME_QUERY,
    LOGOUT_MUTATION,
} from "@repo/common/graphql/operations/auth";
import { graphqlRequest } from "./client";

// Re-export shared types
export type { GraphQLUser as User } from "@repo/common/graphql/types";

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
 * Logout user
 */
export async function logout() {
    const data = await graphqlRequest<{ logout: boolean }>(LOGOUT_MUTATION);
    return data.logout;
}
