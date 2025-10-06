import { render } from "solid-js/web";
import { createSignal, Show } from "solid-js";
import "@repo/ui-components/styles";
import { ThemeProvider } from "../../lib/theme/context.js";
import { AddToWishlist } from "../../components/AddToWishlist.js";
import { WishlistView } from "../../components/WishlistView.js";
import { CategoryManager } from "../../components/CategoryManager.js";

type View = "list" | "add" | "categories";

function Popup() {
  const [currentView, setCurrentView] = createSignal<View>("list");

  const handleAddSuccess = () => {
    setCurrentView("list");
  };

  return (
    <div class="w-96 max-h-[600px] overflow-hidden bg-background">
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
    </div>
  );
}

// Mount the app when the script loads
const root = document.getElementById("app");
if (root) {
  render(
    () => (
      <ThemeProvider>
        <Popup />
      </ThemeProvider>
    ),
    root,
  );
}
