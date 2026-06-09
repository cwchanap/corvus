import { Show } from "solid-js";
import { A, useNavigate } from "@solidjs/router";
import { Title } from "@solidjs/meta";
import { useAuth } from "../lib/auth/context";
import { ThemeProvider } from "../lib/theme/context";
import { useLogout } from "../lib/graphql/hooks/use-auth";
import { Button } from "@repo/ui-components/button";
import { Card, CardContent } from "@repo/ui-components/card";
import { PaperBackground } from "@repo/ui-components/paper-background";

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
  const navigate = useNavigate();
  const logoutMutation = useLogout();

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    navigate("/");
  };

  return (
    <ThemeProvider>
      <Title>Profile - Corvus</Title>
      <Show
        when={auth.user()}
        fallback={
          <>
            <PaperBackground />
            <div class="relative flex min-h-screen items-center justify-center px-4">
              <Card class="max-w-md border border-border bg-card">
                <CardContent class="p-8 text-center">
                  <h1 class="font-display text-2xl font-semibold text-foreground">
                    Access Denied
                  </h1>
                  <p class="mb-6 mt-3 font-serif text-muted-foreground">
                    Please sign in to view your profile.
                  </p>
                  <div class="flex justify-center gap-3">
                    <A href="/signin">
                      <Button>Sign In</Button>
                    </A>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        }
      >
        <>
          <PaperBackground />
          <main class="relative min-h-screen">
            <div class="container mx-auto px-4 py-12">
              <div class="mb-10">
                <p class="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  Specimen Record
                </p>
                <h1 class="font-display text-4xl font-semibold tracking-tight text-foreground">
                  Your Profile
                </h1>
                <div class="mt-4 h-px w-full origin-left bg-border animate-rule" />
              </div>

              <Card class="mx-auto max-w-2xl border border-border bg-card">
                <CardContent class="px-8 py-8">
                  <dl class="divide-y divide-border">
                    <div class="grid grid-cols-1 gap-2 py-4 sm:grid-cols-3 sm:items-baseline">
                      <dt class="font-mono text-xs uppercase tracking-wide text-muted-foreground">
                        Name
                      </dt>
                      <dd class="font-serif text-lg text-foreground sm:col-span-2">
                        {auth.user()!.name}
                      </dd>
                    </div>
                    <div class="grid grid-cols-1 gap-2 py-4 sm:grid-cols-3 sm:items-baseline">
                      <dt class="font-mono text-xs uppercase tracking-wide text-muted-foreground">
                        Email
                      </dt>
                      <dd class="font-serif text-foreground sm:col-span-2">
                        {auth.user()!.email}
                      </dd>
                    </div>
                    <div class="grid grid-cols-1 gap-2 py-4 sm:grid-cols-3 sm:items-baseline">
                      <dt class="font-mono text-xs uppercase tracking-wide text-muted-foreground">
                        Member Since
                      </dt>
                      <dd class="font-mono text-sm text-foreground sm:col-span-2">
                        {formatDate(auth.user()!.createdAt)}
                      </dd>
                    </div>
                    <div class="grid grid-cols-1 gap-2 py-4 sm:grid-cols-3 sm:items-baseline">
                      <dt class="font-mono text-xs uppercase tracking-wide text-muted-foreground">
                        Last Updated
                      </dt>
                      <dd class="font-mono text-sm text-foreground sm:col-span-2">
                        {formatDate(auth.user()!.updatedAt)}
                      </dd>
                    </div>
                  </dl>

                  <div class="mt-8 flex flex-col items-center gap-4 border-t border-border pt-6 sm:flex-row">
                    <A href="/dashboard">
                      <Button variant="outline">Back to Dashboard</Button>
                    </A>
                    <Button
                      variant="destructive"
                      onClick={handleLogout}
                      disabled={logoutMutation.isPending}
                    >
                      {logoutMutation.isPending ? "Signing Out…" : "Sign Out"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </main>
        </>
      </Show>
    </ThemeProvider>
  );
}
