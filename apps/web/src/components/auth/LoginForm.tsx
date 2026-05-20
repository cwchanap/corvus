import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@repo/ui-components/card";
import { getGoogleAuthStartUrl } from "../../lib/graphql/client";

export function LoginForm() {
  return (
    <Card class="w-full shadow-xl border-0 bg-card/80 backdrop-blur-sm">
      <CardHeader class="text-center pb-4">
        <CardTitle class="text-2xl text-card-foreground">
          Welcome Back
        </CardTitle>
      </CardHeader>
      <CardContent class="px-8 pb-8">
        <a
          href={getGoogleAuthStartUrl()}
          class="flex w-full items-center justify-center rounded-xl bg-white px-4 py-3 text-sm font-semibold text-gray-900 shadow-lg ring-1 ring-gray-200 transition-colors duration-200 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          Continue with Google
        </a>
      </CardContent>
    </Card>
  );
}
