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
import { registerAction } from "../../lib/auth/server";

export function RegisterForm() {
  const [isLoading, setIsLoading] = createSignal(false);
  const [error, setError] = createSignal<string>("");

  const handleSubmit = async (event: Event) => {
    event.preventDefault();
    setIsLoading(true);
    setError("");

    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);

    try {
      await registerAction(formData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card class="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Create Account</CardTitle>
        <CardDescription>
          Enter your information to create a new account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} class="space-y-4">
          <div class="space-y-2">
            <label for="name" class="text-sm font-medium">
              Full Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your full name"
            />
          </div>

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
              minLength={8}
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your password (min 8 characters)"
            />
          </div>

          {error() && <div class="text-red-600 text-sm">{error()}</div>}

          <Button type="submit" disabled={isLoading()} class="w-full">
            {isLoading() ? "Creating account..." : "Create Account"}
          </Button>
        </form>

        <div class="mt-4 text-center text-sm">
          Already have an account?{" "}
          <A href="/login" class="text-blue-600 hover:underline">
            Sign in
          </A>
        </div>
      </CardContent>
    </Card>
  );
}
