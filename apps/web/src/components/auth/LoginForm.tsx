import { createSignal } from "solid-js";
import { A, useNavigate } from "@solidjs/router";
import { Button } from "@repo/ui-components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@repo/ui-components/card";
import { useLogin } from "../../lib/graphql/hooks/use-auth";

export function LoginForm() {
  const [error, setError] = createSignal<string>("");
  const navigate = useNavigate();
  const loginMutation = useLogin();

  const handleSubmit = async (event: Event) => {
    event.preventDefault();
    setError("");

    const form = event.currentTarget as HTMLFormElement;
    const formData = new FormData(form);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      const result = await loginMutation.mutateAsync({ email, password });

      if (!result.success) {
        throw new Error(result.error || "Login failed");
      }

      // Navigate to dashboard on success
      navigate("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  };

  return (
    <Card class="w-full shadow-xl border-0 bg-card/80 backdrop-blur-sm">
      <CardHeader class="text-center pb-4">
        <CardTitle class="text-2xl text-card-foreground">
          Welcome Back
        </CardTitle>
      </CardHeader>
      <CardContent class="px-8 pb-8">
        <form onSubmit={handleSubmit} class="space-y-6">
          <div class="space-y-3">
            <label
              for="email"
              class="block text-sm font-medium text-foreground"
            >
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              class="w-full px-4 py-3 border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200 bg-background hover:bg-accent"
              placeholder="your@email.com"
            />
          </div>

          <div class="space-y-3">
            <label
              for="password"
              class="block text-sm font-medium text-foreground"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              class="w-full px-4 py-3 border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200 bg-background hover:bg-accent"
              placeholder="••••••••"
            />
          </div>

          {error() && (
            <div class="bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-destructive text-sm">
              {error()}
            </div>
          )}

          <Button
            type="submit"
            disabled={loginMutation.isPending}
            class="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-3 rounded-xl font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
          >
            {loginMutation.isPending ? "Signing in..." : "Sign In"}
          </Button>
        </form>

        <div class="mt-6 text-center">
          <span class="text-muted-foreground text-sm">
            Don't have an account?{" "}
          </span>
          <A
            href="/register"
            class="text-primary hover:text-primary/80 font-medium text-sm transition-colors duration-200"
          >
            Create Account
          </A>
        </div>
      </CardContent>
    </Card>
  );
}
