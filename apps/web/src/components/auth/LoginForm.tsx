import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@repo/ui-components/card";
import { getGoogleAuthStartUrl } from "../../lib/graphql/client";

interface LoginFormProps {
  error?: string | null;
}

const ERROR_MESSAGES: Record<string, string> = {
  auth_failed:
    "Sign-in failed. The request may have expired or been invalid. Please try again.",
  auth_canceled: "Sign-in was canceled. Please try again when ready.",
  auth_misconfig:
    "Sign-in is currently unavailable due to a server configuration issue. Please try again later.",
  auth_provider_unavailable:
    "Google sign-in is temporarily unavailable. Please try again in a few minutes.",
  auth_token_invalid:
    "Sign-in failed due to an invalid authentication response. Please try again.",
  auth_state_mismatch:
    "Sign-in failed due to an expired or invalid request. Please try again.",
};

export function LoginForm(props: LoginFormProps) {
  const errorMessage = () => {
    const key = props.error;
    if (!key) return null;
    return (
      ERROR_MESSAGES[key] ?? "An unexpected error occurred. Please try again."
    );
  };

  return (
    <Card class="w-full shadow-xl border-0 bg-card/80 backdrop-blur-sm">
      <CardHeader class="text-center pb-4">
        <CardTitle class="text-2xl text-card-foreground">
          Welcome Back
        </CardTitle>
      </CardHeader>
      <CardContent class="px-8 pb-8">
        {errorMessage() && (
          <div
            role="alert"
            class="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200"
          >
            {errorMessage()}
          </div>
        )}
        <a
          href={getGoogleAuthStartUrl()}
          target="_self"
          class="flex w-full items-center justify-center rounded-xl bg-white px-4 py-3 text-sm font-semibold text-gray-900 shadow-lg ring-1 ring-gray-200 transition-colors duration-200 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          Continue with Google
        </a>
      </CardContent>
    </Card>
  );
}
