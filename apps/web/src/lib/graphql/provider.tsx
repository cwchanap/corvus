/**
 * TanStack Query provider for GraphQL
 */

import { QueryClient, QueryClientProvider } from "@tanstack/solid-query";
import type { ParentComponent } from "solid-js";

// Create a query client instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Disable automatic refetching for better control
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
      // Cache for 5 minutes
      staleTime: 5 * 60 * 1000,
      // Keep unused data in cache for 10 minutes
      gcTime: 10 * 60 * 1000,
      // Retry failed requests once
      retry: 1,
    },
  },
});

/**
 * GraphQL Query Provider component
 * Wraps the app to provide TanStack Query functionality
 */
export const GraphQLProvider: ParentComponent = (props) => {
  return (
    <QueryClientProvider client={queryClient}>
      {props.children}
    </QueryClientProvider>
  );
};
