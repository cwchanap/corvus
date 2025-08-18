import { createSignal, createResource, For, Show } from "solid-js";
import { Button } from "@repo/ui-components/button";
import { Card } from "@repo/ui-components/card";
import { Badge } from "@repo/ui-components/badge";
import { WishlistStorage } from "../utils/storage.js";
import type { WishlistCategory } from "../types/wishlist";

interface WishlistViewProps {
  onAddNew?: () => void;
  onManageCategories?: () => void;
}

export function WishlistView(props: WishlistViewProps) {
  const [selectedCategoryId, setSelectedCategoryId] = createSignal<
    string | null
  >(null);

  const [wishlistData, { refetch }] = createResource(
    WishlistStorage.getWishlistData,
  );

  const filteredItems = () => {
    const data = wishlistData();
    if (!data) return [];

    const categoryId = selectedCategoryId();
    if (!categoryId) return data.items;

    return data.items.filter((item) => item.categoryId === categoryId);
  };

  const getCategoryById = (
    categoryId: string,
  ): WishlistCategory | undefined => {
    return wishlistData()?.categories.find((cat) => cat.id === categoryId);
  };

  const handleRemoveItem = async (itemId: string) => {
    try {
      await WishlistStorage.removeItem(itemId);
      refetch();
    } catch (error) {
      console.error("Error removing item:", error);
    }
  };

  const handleOpenItem = (url: string) => {
    chrome.tabs.create({ url });
  };

  return (
    <div class="w-full space-y-4">
      <div class="flex items-center justify-between">
        <h2 class="text-lg font-semibold">My Wishlist</h2>
        <div class="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={props.onManageCategories}
          >
            Categories
          </Button>
          <Button size="sm" onClick={props.onAddNew}>
            Add Page
          </Button>
        </div>
      </div>

      <Show when={wishlistData()}>
        {(data) => (
          <>
            {/* Category Filter */}
            <div class="flex flex-wrap gap-2">
              <Button
                variant={selectedCategoryId() === null ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategoryId(null)}
              >
                All ({data().items.length})
              </Button>
              <For each={data().categories}>
                {(category) => {
                  const itemCount = data().items.filter(
                    (item) => item.categoryId === category.id,
                  ).length;
                  return (
                    <Button
                      variant={
                        selectedCategoryId() === category.id
                          ? "default"
                          : "outline"
                      }
                      size="sm"
                      onClick={() => setSelectedCategoryId(category.id)}
                    >
                      {category.name} ({itemCount})
                    </Button>
                  );
                }}
              </For>
            </div>

            {/* Items List */}
            <div class="space-y-2 max-h-96 overflow-y-auto">
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
                              <div class="min-w-0 flex-1">
                                <h3
                                  class="font-medium text-sm truncate"
                                  title={item.title}
                                >
                                  {item.title}
                                </h3>
                                <div
                                  class="text-xs text-muted-foreground truncate"
                                  title={item.url}
                                >
                                  {item.url}
                                </div>
                                <Show when={item.description}>
                                  <p class="text-xs text-muted-foreground mt-1 line-clamp-2">
                                    {item.description}
                                  </p>
                                </Show>
                              </div>

                              <div class="flex items-center gap-1 flex-shrink-0">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleOpenItem(item.url)}
                                  class="h-6 px-2 text-xs"
                                >
                                  Open
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleRemoveItem(item.id)}
                                  class="h-6 px-2 text-xs text-destructive hover:text-destructive"
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
                                {new Date(item.createdAt).toLocaleDateString()}
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
    </div>
  );
}
