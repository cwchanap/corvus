import { Show } from "solid-js";
import { Title } from "@solidjs/meta";
import { useAuth } from "../lib/auth/context.jsx";
import { WishlistDashboard } from "../components/WishlistDashboard.jsx";
import { ThemeProvider } from "../lib/theme/context.jsx";

export default function Dashboard() {
  const auth = useAuth();

  return (
    <ThemeProvider>
      <Title>Dashboard - Corvus</Title>
      <Show
        when={auth.user()}
        fallback={
          <div class="min-h-screen flex items-center justify-center bg-background">
            <div class="text-center">
              <h1 class="text-2xl font-bold text-foreground mb-4">
                Access Denied
              </h1>
              <p class="text-muted-foreground">
                Please sign in to access your dashboard.
              </p>
            </div>
          </div>
        }
      >
        <WishlistDashboard user={auth.user()!} />
      </Show>
    </ThemeProvider>
  );
}
