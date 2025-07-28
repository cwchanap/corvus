import { Show } from "solid-js";
import { Title } from "@solidjs/meta";
import { useAuth } from "../lib/auth/context";
import { WishlistDashboard } from "../components/WishlistDashboard";

export default function Dashboard() {
  const auth = useAuth();

  return (
    <>
      <Title>Dashboard - Corvus</Title>
      <Show
        when={auth.user()}
        fallback={
          <div class="min-h-screen flex items-center justify-center">
            <div class="text-center">
              <h1 class="text-2xl font-bold text-gray-900 mb-4">
                Access Denied
              </h1>
              <p class="text-gray-600">
                Please sign in to access your dashboard.
              </p>
            </div>
          </div>
        }
      >
        <WishlistDashboard user={auth.user()!} />
      </Show>
    </>
  );
}
