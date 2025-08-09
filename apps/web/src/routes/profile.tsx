import { Show } from "solid-js";
import { A } from "@solidjs/router";
import { Title } from "@solidjs/meta";
import { useAuth } from "../lib/auth/context.jsx";
import { ThemeProvider } from "../lib/theme/context.jsx";
import { logoutAction } from "../lib/auth/server.js";
import { Button } from "@repo/ui-components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui-components/card";

function formatDate(value: unknown): string {
  if (!value) return "—";
  try {
    const d =
      typeof value === "string" || typeof value === "number"
        ? new Date(value)
        : value instanceof Date
          ? value
          : new Date(String(value));
    return isNaN((d as Date).getTime()) ? "—" : (d as Date).toLocaleString();
  } catch {
    return "—";
  }
}

export default function Profile() {
  const auth = useAuth();

  return (
    <ThemeProvider>
      <Title>Profile - Corvus</Title>
      <Show
        when={auth.user()}
        fallback={
          <div class="min-h-screen flex items-center justify-center bg-background">
            <div class="text-center">
              <h1 class="text-2xl font-bold text-foreground mb-4">
                Access Denied
              </h1>
              <p class="text-muted-foreground">
                Please sign in to view your profile.
              </p>
              <div class="mt-6 flex gap-3 justify-center">
                <A href="/login">
                  <Button>Sign In</Button>
                </A>
                <A href="/register">
                  <Button variant="outline">Create Account</Button>
                </A>
              </div>
            </div>
          </div>
        }
      >
        <main class="min-h-screen bg-background">
          <div class="container mx-auto px-4 py-10">
            <Card class="max-w-xl mx-auto">
              <CardHeader>
                <CardTitle>Your Profile</CardTitle>
                <CardDescription>Account details</CardDescription>
              </CardHeader>
              <CardContent class="space-y-6">
                <div class="space-y-4">
                  <div class="grid grid-cols-3 gap-4">
                    <div class="text-sm text-muted-foreground">Name</div>
                    <div class="col-span-2 font-medium text-foreground">
                      {auth.user()!.name}
                    </div>
                  </div>
                  <div class="grid grid-cols-3 gap-4">
                    <div class="text-sm text-muted-foreground">Email</div>
                    <div class="col-span-2 text-foreground">
                      {auth.user()!.email}
                    </div>
                  </div>
                  <div class="grid grid-cols-3 gap-4">
                    <div class="text-sm text-muted-foreground">
                      Member Since
                    </div>
                    <div class="col-span-2 text-foreground">
                      {formatDate(auth.user()!.created_at)}
                    </div>
                  </div>
                  <div class="grid grid-cols-3 gap-4">
                    <div class="text-sm text-muted-foreground">
                      Last Updated
                    </div>
                    <div class="col-span-2 text-foreground">
                      {formatDate(auth.user()!.updated_at)}
                    </div>
                  </div>
                </div>

                <div class="flex items-center gap-3">
                  <A href="/dashboard">
                    <Button variant="outline">Back to Dashboard</Button>
                  </A>
                  <form method="post" action={logoutAction}>
                    <Button type="submit" variant="destructive">
                      Sign Out
                    </Button>
                  </form>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </Show>
    </ThemeProvider>
  );
}
