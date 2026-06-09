import { Title } from "@solidjs/meta";
import { useSearchParams } from "@solidjs/router";
import { GoogleAuthForm } from "../components/auth/GoogleAuthForm";
import { ThemeProvider } from "../lib/theme/context";
import { AuthPageHeader } from "../components/AuthPageHeader";
import { PaperBackground } from "@repo/ui-components/paper-background";

export default function SignUp() {
  const [searchParams] = useSearchParams();
  const error = Array.isArray(searchParams.error)
    ? searchParams.error[0]
    : searchParams.error;

  return (
    <ThemeProvider>
      <Title>Sign Up - Corvus</Title>
      <PaperBackground />
      <div class="relative flex min-h-screen items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
        <div class="w-full max-w-sm">
          <AuthPageHeader />
          <GoogleAuthForm mode="signup" error={error} />
        </div>
      </div>
    </ThemeProvider>
  );
}
