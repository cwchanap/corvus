import { render } from "solid-js/web";
import { createSignal, Show, Switch, Match } from "solid-js";
import "@repo/ui-components/styles";
import "@fontsource-variable/fraunces";
import "@fontsource-variable/newsreader";
import "@fontsource-variable/spline-sans-mono";
import { Button } from "@repo/ui-components/button";
import { ThemeProvider } from "../../lib/theme/context";
import { AddToWishlist } from "../../components/AddToWishlist";
import { WishlistView } from "../../components/WishlistView";
import { CategoryManager } from "../../components/CategoryManager";
import {
  WishlistDataProvider,
  useWishlistData,
} from "../../lib/wishlist/context";
import { isAuthError } from "../../lib/graphql/client";

type View = "list" | "add" | "categories";

function LoadingScreen() {
  return (
    <div class="flex h-full w-full items-center justify-center bg-background">
      <div class="space-y-1 text-center">
        <div class="font-mono text-xs uppercase tracking-wide">
          Loading wishlist…
        </div>
        <div class="font-serif text-sm text-muted-foreground">
          Hang tight while we sync your data.
        </div>
      </div>
    </div>
  );
}

function ErrorScreen(props: {
  message: string;
  isAuthError: boolean;
  onRetry: () => void;
}) {
  // Dev-aware fallback so local login redirects go to the dev web app (port
  // 5000), not production. Only used when VITE_WEB_BASE is unset. Any mode
  // that is not explicitly "production" falls through to localhost so a
  // misconfigured or unexpected mode can never silently route login to prod.
  const webAppUrl =
    import.meta.env.VITE_WEB_BASE ||
    (import.meta.env.MODE === "production"
      ? "https://corvus.cwchanap.dev"
      : "http://localhost:5000");

  const handleLoginRedirect = () => {
    const loginUrl = new URL("/signin", webAppUrl);
    loginUrl.searchParams.set("source", "extension");
    browser.tabs.create({ url: loginUrl.toString() });
  };

  return (
    <div class="flex h-full w-full flex-col items-center justify-center gap-3 bg-background px-4 text-center">
      <div class="space-y-1">
        <div class="font-mono text-xs uppercase tracking-wide text-destructive">
          {props.isAuthError ? "Not signed in" : "Unable to load wishlist"}
        </div>
        <div class="font-serif text-sm text-muted-foreground">
          {props.message}
        </div>
      </div>
      <Show
        when={props.isAuthError}
        fallback={
          <Button size="sm" onClick={props.onRetry}>
            Try again
          </Button>
        }
      >
        <div class="flex gap-2">
          <Button size="sm" onClick={handleLoginRedirect}>
            Sign in
          </Button>
          <Button size="sm" variant="outline" onClick={props.onRetry}>
            Try again
          </Button>
        </div>
      </Show>
    </div>
  );
}

function Popup() {
  const [currentView, setCurrentView] = createSignal<View>("list");
  const { state, error, refetch } = useWishlistData();

  const handleAddSuccess = () => {
    setCurrentView("list");
  };

  const dataState = () => state();
  const isErrored = () => dataState() === "errored";
  const canShowContent = () => {
    const current = dataState();
    return current === "ready" || current === "refreshing";
  };

  const isAuthFailure = () => isAuthError(error());

  const errorMessage = () => {
    const cause = error();
    if (isAuthFailure()) {
      return "Please sign in to access your wishlist.";
    }
    if (cause instanceof Error) {
      return cause.message;
    }
    return "Failed to fetch. Please check your connection.";
  };

  return (
    <div class="w-96 h-[600px] bg-background overflow-hidden">
      <Switch fallback={<LoadingScreen />}>
        <Match when={isErrored()}>
          <ErrorScreen
            message={errorMessage()}
            isAuthError={isAuthFailure()}
            onRetry={() => void refetch()}
          />
        </Match>
        <Match when={canShowContent()}>
          <Show
            when={currentView() === "add"}
            fallback={
              <Show
                when={currentView() === "categories"}
                fallback={
                  <div class="p-4">
                    <WishlistView
                      onAddNew={() => setCurrentView("add")}
                      onManageCategories={() => setCurrentView("categories")}
                    />
                  </div>
                }
              >
                <div class="p-4">
                  <CategoryManager onClose={() => setCurrentView("list")} />
                </div>
              </Show>
            }
          >
            <div class="p-4">
              <AddToWishlist
                onSuccess={handleAddSuccess}
                onCancel={() => setCurrentView("list")}
              />
            </div>
          </Show>
        </Match>
      </Switch>
    </div>
  );
}

// Mount the app when the script loads
const root = document.getElementById("app");
if (root) {
  render(
    () => (
      <ThemeProvider>
        <WishlistDataProvider>
          <Popup />
        </WishlistDataProvider>
      </ThemeProvider>
    ),
    root,
  );
}
