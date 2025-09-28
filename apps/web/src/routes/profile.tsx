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
          <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900">
            <Card class="shadow-xl border-0 bg-card/80 backdrop-blur-sm max-w-md">
              <CardContent class="text-center p-8">
                <h1 class="text-2xl font-bold text-foreground mb-4">
                  Access Denied
                </h1>
                <p class="text-muted-foreground mb-6">
                  Please sign in to view your profile.
                </p>
                <div class="flex gap-3 justify-center">
                  <A href="/login">
                    <Button class="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-2 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl">
                      Sign In
                    </Button>
                  </A>
                  <A href="/register">
                    <Button
                      variant="outline"
                      class="border-purple-200 dark:border-purple-700 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/50 px-6 py-2 rounded-xl font-medium transition-all duration-200"
                    >
                      Create Account
                    </Button>
                  </A>
                </div>
              </CardContent>
            </Card>
          </div>
        }
      >
        <main class="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900">
          <div class="container mx-auto px-4 py-12">
            <div class="text-center mb-8">
              <h1 class="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                Your Profile
              </h1>
              <p class="text-muted-foreground">
                Manage your account information
              </p>
            </div>

            <Card class="max-w-2xl mx-auto shadow-xl border-0 bg-card/80 backdrop-blur-sm">
              <CardHeader class="text-center pb-6">
                <CardTitle class="text-2xl text-card-foreground">
                  Account Details
                </CardTitle>
                <CardDescription class="text-muted-foreground">
                  Your personal information
                </CardDescription>
              </CardHeader>
              <CardContent class="px-8 pb-8 space-y-8">
                <div class="space-y-6">
                  <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center py-4 border-b border-border">
                    <div class="text-sm font-medium text-muted-foreground">
                      Name
                    </div>
                    <div class="col-span-2 font-semibold text-foreground text-lg">
                      {auth.user()!.name}
                    </div>
                  </div>
                  <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center py-4 border-b border-border">
                    <div class="text-sm font-medium text-muted-foreground">
                      Email
                    </div>
                    <div class="col-span-2 text-foreground">
                      {auth.user()!.email}
                    </div>
                  </div>
                  <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center py-4 border-b border-border">
                    <div class="text-sm font-medium text-muted-foreground">
                      Member Since
                    </div>
                    <div class="col-span-2 text-foreground">
                      {formatDate(auth.user()!.created_at)}
                    </div>
                  </div>
                  <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center py-4">
                    <div class="text-sm font-medium text-muted-foreground">
                      Last Updated
                    </div>
                    <div class="col-span-2 text-foreground">
                      {formatDate(auth.user()!.updated_at)}
                    </div>
                  </div>
                </div>

                <div class="flex flex-col sm:flex-row items-center gap-4 pt-6">
                  <A href="/dashboard">
                    <Button
                      variant="outline"
                      class="border-purple-200 dark:border-purple-700 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/50 px-6 py-3 rounded-xl font-medium transition-all duration-200 w-full sm:w-auto"
                    >
                      Back to Dashboard
                    </Button>
                  </A>
                  <form
                    method="post"
                    action={logoutAction}
                    class="w-full sm:w-auto"
                  >
                    <Button
                      type="submit"
                      class="bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 w-full sm:w-auto"
                    >
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
