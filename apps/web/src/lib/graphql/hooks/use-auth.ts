/**
 * TanStack Query hooks for authentication operations
 */

import {
    createQuery,
    createMutation,
    useQueryClient,
} from "@tanstack/solid-query";
import { getCurrentUser, logout } from "../auth";

/**
 * Query hook to get current authenticated user
 */
export function useCurrentUser() {
    return createQuery(() => ({
        queryKey: ["auth", "me"],
        queryFn: getCurrentUser,
        retry: false, // Don't retry if unauthenticated
    }));
}

/**
 * Mutation hook to logout
 */
export function useLogout() {
    const queryClient = useQueryClient();

    return createMutation(() => ({
        mutationFn: logout,
        onSuccess: () => {
            // Clear user cache and invalidate all queries
            queryClient.setQueryData(["auth", "me"], null);
            queryClient.invalidateQueries();
        },
        onError: (error) => {
            console.error("[useLogout] Logout failed:", error);
        },
    }));
}
