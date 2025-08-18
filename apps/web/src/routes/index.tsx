import { Show } from "solid-js";
import { A } from "@solidjs/router";
import { Title } from "@solidjs/meta";
import { Button } from "@repo/ui-components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui-components/card";
import { useAuth } from "../lib/auth/context.jsx";

export default function Home() {
  const auth = useAuth();

  return (
    <>
      <Title>Corvus - Modern SolidJS Application</Title>
      <main class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div class="container mx-auto px-4 py-16">
          <div class="text-center mb-12">
            <h1 class="text-5xl font-bold text-gray-900 mb-4">
              Welcome to Corvus
            </h1>
            <p class="text-xl text-gray-600 max-w-2xl mx-auto">
              A modern SolidJS application with authentication, built for
              Cloudflare Workers
            </p>
          </div>

          <div class="max-w-4xl mx-auto">
            <Show
              when={auth.isAuthenticated()}
              fallback={
                <div class="grid md:grid-cols-2 gap-8">
                  <Card>
                    <CardHeader>
                      <CardTitle>Get Started</CardTitle>
                      <CardDescription>
                        Create an account to access all features
                      </CardDescription>
                    </CardHeader>
                    <CardContent class="space-y-4">
                      <A href="/register">
                        <Button class="w-full">Create Account</Button>
                      </A>
                      <A href="/login">
                        <Button variant="outline" class="w-full">
                          Sign In
                        </Button>
                      </A>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Features</CardTitle>
                      <CardDescription>
                        What you get with Corvus
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul class="space-y-2 text-sm">
                        <li class="flex items-center">
                          <span class="w-2 h-2 bg-green-500 rounded-full mr-3" />
                          Secure authentication with Cloudflare D1
                        </li>
                        <li class="flex items-center">
                          <span class="w-2 h-2 bg-green-500 rounded-full mr-3" />
                          Type-safe database queries with Kysely
                        </li>
                        <li class="flex items-center">
                          <span class="w-2 h-2 bg-green-500 rounded-full mr-3" />
                          Modern UI with Tailwind CSS
                        </li>
                        <li class="flex items-center">
                          <span class="w-2 h-2 bg-green-500 rounded-full mr-3" />
                          Fast global deployment
                        </li>
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              }
            >
              <div class="text-center">
                <Card class="max-w-md mx-auto">
                  <CardHeader>
                    <CardTitle>Welcome back, {auth.user()?.name}!</CardTitle>
                    <CardDescription>You're already signed in</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <A href="/dashboard">
                      <Button class="w-full">Go to Dashboard</Button>
                    </A>
                  </CardContent>
                </Card>
              </div>
            </Show>
          </div>
        </div>
      </main>
    </>
  );
}
