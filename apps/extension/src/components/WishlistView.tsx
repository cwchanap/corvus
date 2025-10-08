import { createSignal, For, Show, createEffect } from "solid-js";
import { Button } from "@repo/ui-components/button";
import { Card } from "@repo/ui-components/card";
import { Badge } from "@repo/ui-components/badge";
import { ThemeToggle } from "@repo/ui-components/theme-toggle";
import { Select } from "@repo/ui-components/select";
import { useTheme } from "../lib/theme/context.js";
import { WishlistApiError } from "@repo/common/api/wishlist-client";
import { useWishlistData } from "../lib/wishlist/context.js";
import type { WishlistCategory, WishlistItem } from "../types/wishlist";
import { ItemDetailsModal } from "./ItemDetailsModal.js";

interface WishlistViewProps {
  onAddNew?: () => void;
  onManageCategories?: () => void;
}

export function WishlistView(props: WishlistViewProps) {
  const theme = useTheme();
  const [selectedCategoryId, setSelectedCategoryId] = createSignal<
    string | null
  >(null);

  const {
    value: wishlistValue,
    state: wishlistState,
    error: wishlistError,
    refetch,
    api: wishlistApi,
  } = useWishlistData();
  const [viewingItem, setViewingItem] = createSignal<WishlistItem | null>(null);

  const resolvedWishlist = () => wishlistValue();
  const isErrored = () => wishlistState() === "errored";
  const errorMessage = () => {
    const error = wishlistError();
    if (error instanceof WishlistApiError) return error.message;
    if (error instanceof Error) return error.message;
    return "Unable to load your wishlist. Please sign in.";
  };

  const openItemDetails = (item: WishlistItem) => {
    setViewingItem(item);
  };

  const closeItemDetails = () => {
    setViewingItem(null);
  };

  const filteredItems = (): WishlistItem[] => {
    const data = resolvedWishlist();
    if (!data) return [];

    const categoryId = selectedCategoryId();
    if (!categoryId) return data.items;

    return data.items.filter((item) => item.categoryId === categoryId);
  };

  const getCategoryById = (
    categoryId: string,
  ): WishlistCategory | undefined => {
    const data = resolvedWishlist();
    if (!data) return undefined;
    return data.categories.find((cat) => cat.id === categoryId);
  };

  const handleRemoveItem = async (itemId: string) => {
    try {
      await wishlistApi.deleteItem(itemId);
      if (viewingItem()?.id === itemId) {
        closeItemDetails();
      }
      await refetch();
    } catch (error) {
      console.error("Error removing item:", error);
      if (error instanceof WishlistApiError) {
        alert(error.message);
      } else if (error instanceof Error) {
        alert(error.message);
      } else {
        alert("Failed to remove item");
      }
    }
  };

  const handleOpenItem = (url: string) => {
    chrome.tabs.create({ url });
  };

  createEffect(() => {
    const current = viewingItem();
    if (!current) return;

    const updated = resolvedWishlist()?.items.find(
      (item) => item.id === current.id,
    );

    if (!updated) {
      closeItemDetails();
      return;
    }

    if (updated !== current) {
      setViewingItem(updated);
    }
  });

  return (
    <div class="flex h-full w-full flex-col space-y-4">
      <div class="flex items-center justify-between">
        <h2 class="text-lg font-semibold">My Wishlist</h2>
        <div class="flex gap-2">
          <ThemeToggle
            theme={theme.theme}
            setTheme={theme.setTheme}
            resolvedTheme={theme.resolvedTheme}
          />
          <Button
            size="sm"
            variant="outline"
            onClick={props.onManageCategories}
          >
            Categories
          </Button>
          <Button size="sm" variant="outline" onClick={props.onAddNew}>
            Add Page
          </Button>
        </div>
      </div>

      <Show
        when={resolvedWishlist()}
        fallback={
          <div class="flex-1 rounded border border-dashed border-input bg-muted/30 p-6 text-center text-sm text-muted-foreground">
            {isErrored() ? errorMessage() : "Loading wishlist…"}
          </div>
        }
      >
        {(data) => (
          <>
            {/* Category Filter */}
            <div class="space-y-2">
              <label class="text-sm font-medium">Filter by Category</label>
              <Select
                value={selectedCategoryId() ?? "all"}
                onChange={(event) =>
                  setSelectedCategoryId(
                    event.currentTarget.value === "all"
                      ? null
                      : event.currentTarget.value,
                  )
                }
              >
                <option value="all">All ({data().items.length})</option>
                <For each={data().categories}>
                  {(category) => {
                    const itemCount = data().items.filter(
                      (item) => item.categoryId === category.id,
                    ).length;
                    return (
                      <option value={category.id}>
                        {category.name} ({itemCount})
                      </option>
                    );
                  }}
                </For>
              </Select>
            </div>

            {/* Items List */}
            <div class="space-y-2 flex-1 overflow-y-auto">
              <Show
                when={filteredItems().length > 0}
                fallback={
                  <div class="text-center py-8 text-muted-foreground">
                    <div class="text-sm">No items in this category yet</div>
                    <Button
                      variant="link"
                      size="sm"
                      onClick={props.onAddNew}
                      class="mt-2"
                    >
                      Add your first item
                    </Button>
                  </div>
                }
              >
                <For each={filteredItems()}>
                  {(item) => {
                    const category = getCategoryById(item.categoryId);
                    const itemLinks = item.links || [];

                    return (
                      <Card class="p-3">
                        <div class="flex items-start gap-3">
                          <Show when={item.favicon}>
                            <img
                              src={item.favicon}
                              alt=""
                              class="w-4 h-4 mt-0.5 flex-shrink-0"
                            />
                          </Show>

                          <div class="min-w-0 flex-1">
                            <div class="flex items-start justify-between gap-2">
                              <button
                                type="button"
                                onClick={() => openItemDetails(item)}
                                class="min-w-0 flex-1 text-left bg-transparent border-0 p-0 outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md"
                              >
                                <h3
                                  class="font-medium text-sm truncate hover:text-primary transition-colors"
                                  title={item.title}
                                >
                                  {item.title}
                                </h3>

                                <Show when={item.description}>
                                  <p class="text-xs text-muted-foreground mt-1 line-clamp-2">
                                    {item.description}
                                  </p>
                                </Show>
                              </button>

                              <div class="flex items-center gap-1 flex-shrink-0">
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleRemoveItem(item.id)}
                                  class="h-6 px-2 text-xs"
                                >
                                  Remove
                                </Button>
                              </div>
                            </div>

                            <div class="flex items-center justify-between mt-2">
                              <Show when={category}>
                                <Badge
                                  variant="secondary"
                                  class="text-xs"
                                  style={{
                                    "background-color": category?.color + "20",
                                    color: category?.color,
                                  }}
                                >
                                  {category?.name}
                                </Badge>
                              </Show>
                              <div class="text-xs text-muted-foreground">
                                {itemLinks.length} link
                                {itemLinks.length !== 1 ? "s" : ""}
                              </div>
                            </div>
                          </div>
                        </div>
                      </Card>
                    );
                  }}
                </For>
              </Show>
            </div>
          </>
        )}
      </Show>
      <ItemDetailsModal
        item={viewingItem() ?? undefined}
        category={
          viewingItem() ? getCategoryById(viewingItem()!.categoryId) : undefined
        }
        onClose={closeItemDetails}
        onOpenLink={handleOpenItem}
      />
    </div>
  );
}
