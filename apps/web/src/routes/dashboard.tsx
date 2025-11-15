import { Show, createEffect } from "solid-js";
import { Title } from "@solidjs/meta";
import { useNavigate } from "@solidjs/router";
import { useAuth } from "../lib/auth/context";
import { WishlistDashboard } from "../components/WishlistDashboard";
import { ThemeProvider } from "../lib/theme/context";

export default function Dashboard() {
  const auth = useAuth();
  const navigate = useNavigate();

  createEffect(() => {
    // Only redirect when loading is complete and user is not authenticated
    if (!auth.isLoading() && !auth.isAuthenticated()) {
      navigate("/login", { replace: true });
    }
  });

  return (
    <ThemeProvider>
      <Title>Dashboard - Corvus</Title>
      <Show
        when={!auth.isLoading()}
        fallback={
          <div class="min-h-screen flex items-center justify-center bg-background">
            <div class="text-center">
              <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
              <p class="text-muted-foreground">Loading...</p>
            </div>
          </div>
        }
      >
        <Show
          when={auth.isAuthenticated() && auth.user()}
          fallback={
            <div class="min-h-screen flex items-center justify-center bg-background">
              <div class="text-center">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
                <p class="text-muted-foreground">Redirecting...</p>
              </div>
            </div>
          }
        >
          <WishlistDashboard user={auth.user()!} />
        </Show>
      </Show>
    </ThemeProvider>
  );
}
