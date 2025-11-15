import { Title } from "@solidjs/meta";
import { LoginForm } from "../components/auth/LoginForm";
import { ThemeProvider } from "../lib/theme/context";

export default function Login() {
  return (
    <ThemeProvider>
      <Title>Sign In - Corvus</Title>
      <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900 py-8 px-4 sm:px-6 lg:px-8">
        <div class="w-full max-w-sm">
          <div class="text-center mb-8">
            <h1 class="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Corvus
            </h1>
            <p class="text-muted-foreground text-sm mt-2">
              Your personal wishlist companion
            </p>
          </div>
          <LoginForm />
        </div>
      </div>
    </ThemeProvider>
  );
}
