import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@repo/ui-components/card";
import { getGoogleAuthStartUrl } from "../../lib/graphql/client";

interface GoogleAuthFormProps {
  mode: "signin" | "signup";
  error?: string | null;
}

// Error messages are mode-agnostic: they apply to both sign-in and sign-up.
// (TITLES and BUTTON_LABELS below are intentionally mode-specific.)
const ERROR_MESSAGES: Record<string, string> = {
  auth_failed:
    "Authentication failed. The request may have expired or been invalid. Please try again.",
  auth_canceled: "Authentication was canceled. Please try again when ready.",
  auth_misconfig:
    "Authentication is currently unavailable due to a server configuration issue. Please try again later.",
  auth_provider_unavailable:
    "Google authentication is temporarily unavailable. Please try again in a few minutes.",
  auth_token_invalid:
    "Authentication failed due to an invalid authentication response. Please try again.",
  auth_state_mismatch:
    "Authentication failed due to an expired or invalid request. Please try again.",
};

const TITLES: Record<GoogleAuthFormProps["mode"], string> = {
  signin: "Welcome Back",
  signup: "Get Started",
};

const BUTTON_LABELS: Record<GoogleAuthFormProps["mode"], string> = {
  signin: "Continue with Google",
  signup: "Sign up with Google",
};

export function GoogleAuthForm(props: GoogleAuthFormProps) {
  const errorMessage = () => {
    const key = props.error;
    if (!key) return null;
    return (
      ERROR_MESSAGES[key] ?? "An unexpected error occurred. Please try again."
    );
  };

  return (
    <Card class="w-full border border-border bg-card">
      <CardHeader class="pb-4 text-center">
        <CardTitle class="font-display text-2xl text-card-foreground">
          {TITLES[props.mode]}
        </CardTitle>
      </CardHeader>
      <CardContent class="px-8 pb-8">
        {errorMessage() && (
          <div
            role="alert"
            class="mb-4 rounded-sm border border-destructive/40 bg-destructive/10 px-4 py-3 font-serif text-sm text-destructive"
          >
            {errorMessage()}
          </div>
        )}
        <a
          href={getGoogleAuthStartUrl()}
          target="_self"
          class="flex w-full items-center justify-center gap-2 rounded-sm border border-primary bg-primary px-4 py-3 font-mono text-xs font-medium uppercase tracking-wide text-primary-foreground transition-colors duration-200 hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          {BUTTON_LABELS[props.mode]}
        </a>
      </CardContent>
    </Card>
  );
}
