import { render } from "solid-js/web";
import { createSignal, Show, Switch, Match } from "solid-js";
import "@repo/ui-components/styles";
import { Button } from "@repo/ui-components/button";
import { ThemeProvider } from "../../lib/theme/context.js";
import { AddToWishlist } from "../../components/AddToWishlist.js";
import { WishlistView } from "../../components/WishlistView.js";
import { CategoryManager } from "../../components/CategoryManager.js";
import {
  WishlistDataProvider,
  useWishlistData,
} from "../../lib/wishlist/context.js";

type View = "list" | "add" | "categories";

function LoadingScreen() {
  return (
    <div class="flex h-full w-full items-center justify-center bg-background">
      <div class="space-y-1 text-center">
        <div class="text-sm font-medium">Loading wishlist…</div>
        <div class="text-xs text-muted-foreground">
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
  const webAppUrl = import.meta.env.VITE_WEB_BASE || "http://localhost:5000";

  const handleLoginRedirect = () => {
    browser.tabs.create({ url: `${webAppUrl}/login` });
  };

  return (
    <div class="flex h-full w-full flex-col items-center justify-center gap-3 bg-background px-4 text-center">
      <div class="space-y-1">
        <div class="text-sm font-semibold text-destructive">
          {props.isAuthError ? "Not signed in" : "Unable to load wishlist"}
        </div>
        <div class="text-xs text-muted-foreground">{props.message}</div>
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

  const isAuthError = () => {
    const cause = error();
    if (cause instanceof Error) {
      const msg = cause.message.toLowerCase();
      return (
        msg.includes("not authenticated") ||
        msg.includes("unauthenticated") ||
        msg.includes("unauthorized") ||
        msg.includes("authentication") ||
        msg.includes("sign in")
      );
    }
    return false;
  };

  const errorMessage = () => {
    const cause = error();
    if (isAuthError()) {
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
            isAuthError={isAuthError()}
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
