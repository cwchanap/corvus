import { Title } from "@solidjs/meta";
import { useSearchParams } from "@solidjs/router";
import { GoogleAuthForm } from "../components/auth/GoogleAuthForm";
import { ThemeProvider } from "../lib/theme/context";
import { CorvusMark } from "@repo/ui-components/corvus-mark";
import { PaperBackground } from "@repo/ui-components/paper-background";

export default function SignIn() {
  const [searchParams] = useSearchParams();
  const error = Array.isArray(searchParams.error)
    ? searchParams.error[0]
    : searchParams.error;

  return (
    <ThemeProvider>
      <Title>Sign In - Corvus</Title>
      <PaperBackground />
      <div class="relative flex min-h-screen items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
        <div class="w-full max-w-sm">
          <div class="mb-8 flex flex-col items-center text-center">
            <CorvusMark title="Corvus" class="mb-4 h-12 w-12 animate-rise" />
            <h1 class="font-display text-4xl font-semibold tracking-tight text-foreground animate-rise">
              Corvus
            </h1>
            <p class="mt-2 font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
              A catalogue of desire
            </p>
          </div>
          <GoogleAuthForm mode="signin" error={error} />
        </div>
      </div>
    </ThemeProvider>
  );
}
