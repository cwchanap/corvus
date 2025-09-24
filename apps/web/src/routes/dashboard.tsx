import { Show } from "solid-js";
import { Title } from "@solidjs/meta";
import { createAsync, redirect } from "@solidjs/router";
import { useAuth } from "../lib/auth/context.jsx";
import { WishlistDashboard } from "../components/WishlistDashboard.jsx";
import { ThemeProvider } from "../lib/theme/context.jsx";
import { getCookie } from "vinxi/http";
import type { PublicUser } from "../lib/db/types.js";

async function getServerUser(): Promise<PublicUser | null> {
  "use server";

  try {
    const sessionCookie = getCookie("corvus-session");
    if (!sessionCookie) {
      throw redirect("/login");
    }

    // Make request to API to validate session
    const response = await fetch("http://localhost:8787/api/auth/me", {
      headers: {
        Cookie: `corvus-session=${sessionCookie}`,
      },
    });

    if (!response.ok) {
      throw redirect("/login");
    }

    const data = (await response.json()) as { user: PublicUser | null };
    if (!data.user) {
      throw redirect("/login");
    }

    return data.user;
  } catch (error) {
    if (error instanceof Response) {
      throw error; // Re-throw redirect responses
    }
    console.error("Server auth check failed:", error);
    throw redirect("/login");
  }
}

export default function Dashboard() {
  const serverUser = createAsync(() => getServerUser());

  return (
    <ThemeProvider>
      <Title>Dashboard - Corvus</Title>
      <Show
        when={serverUser()}
        fallback={
          <div class="min-h-screen flex items-center justify-center bg-background">
            <div class="text-center">
              <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground mx-auto mb-4" />
              <p class="text-muted-foreground">Loading...</p>
            </div>
          </div>
        }
      >
        <WishlistDashboard user={serverUser()!} />
      </Show>
    </ThemeProvider>
  );
}
