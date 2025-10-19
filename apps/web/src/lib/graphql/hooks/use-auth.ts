/**
 * TanStack Query hooks for authentication operations
 */

import {
  createQuery,
  createMutation,
  useQueryClient,
} from "@tanstack/solid-query";
import { getCurrentUser, login, logout, register } from "../auth.js";

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
 * Mutation hook to register a new user
 */
export function useRegister() {
  const queryClient = useQueryClient();

  return createMutation(() => ({
    mutationFn: register,
    onSuccess: (data) => {
      if (data.success && data.user) {
        // Update the current user cache
        queryClient.setQueryData(["auth", "me"], data.user);
      }
    },
  }));
}

/**
 * Mutation hook to login
 */
export function useLogin() {
  const queryClient = useQueryClient();

  return createMutation(() => ({
    mutationFn: login,
    onSuccess: (data) => {
      if (data.success && data.user) {
        // Update the current user cache
        queryClient.setQueryData(["auth", "me"], data.user);
      }
    },
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
  }));
}
