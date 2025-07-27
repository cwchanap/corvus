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
import { loginAction } from "../../lib/auth/server";

export function LoginForm() {
  const [isLoading, setIsLoading] = createSignal(false);
  const [error, setError] = createSignal<string>("");

  const handleSubmit = async (event: Event) => {
    event.preventDefault();
    setIsLoading(true);
    setError("");

    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);

    try {
      await loginAction(formData);
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
