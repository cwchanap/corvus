import { ParentComponent, Show } from "solid-js";
import { Navigate } from "@solidjs/router";
import { useAuth } from "../../lib/auth/context";

export const ProtectedRoute: ParentComponent = (props) => {
  const auth = useAuth();

  return (
    <Show
      when={!auth.isLoading()}
      fallback={
        <div class="min-h-screen flex items-center justify-center">
          <div class="text-center">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
            <p class="mt-2 text-gray-600">Loading...</p>
          </div>
        </div>
      }
    >
      <Show when={auth.isAuthenticated()} fallback={<Navigate href="/login" />}>
        {props.children}
      </Show>
    </Show>
  );
};
