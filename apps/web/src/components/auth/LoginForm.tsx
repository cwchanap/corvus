import { createSignal } from "solid-js";
import { A } from "@solidjs/router";
import { Button } from "@repo/ui-components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui-components/card";

const API_BASE = "http://localhost:8787";
const getApiUrl = (path: string) => `${API_BASE}${path}`;

export function LoginForm() {
  const [isLoading, setIsLoading] = createSignal(false);
  const [error, setError] = createSignal<string>("");

  const handleSubmit = async (event: Event) => {
    event.preventDefault();
    setIsLoading(true);
    setError("");

    const form = event.currentTarget as HTMLFormElement;
    const formData = new FormData(form);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      const response = await fetch(getApiUrl("/api/auth/login"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      let data: { error?: string; success?: boolean } = {};

      try {
        data = (await response.json()) as {
          error?: string;
          success?: boolean;
        };
      } catch (parseError) {
        // If response is not valid JSON (e.g., HTML error page), provide a generic error
        if (!response.ok) {
          throw new Error(
            `Server error (${response.status}): API server may not be running`,
          );
        }
        throw new Error("Invalid response from server");
      }

      if (!response.ok) {
        throw new Error(data.error || "Login failed");
      }

      // Full reload so server picks up HTTP-only session cookie
      window.location.href = "/dashboard";
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card class="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Sign In</CardTitle>
        <CardDescription>
          Enter your email and password to access your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} class="space-y-4">
          <div class="space-y-2">
            <label for="email" class="text-sm font-medium">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your email"
            />
          </div>

          <div class="space-y-2">
            <label for="password" class="text-sm font-medium">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your password"
            />
          </div>

          {error() && <div class="text-red-600 text-sm">{error()}</div>}

          <Button type="submit" disabled={isLoading()} class="w-full">
            {isLoading() ? "Signing in..." : "Sign In"}
          </Button>
        </form>

        <div class="mt-4 text-center text-sm">
          Don't have an account?{" "}
          <A href="/register" class="text-blue-600 hover:underline">
            Sign up
          </A>
        </div>
      </CardContent>
    </Card>
  );
}
