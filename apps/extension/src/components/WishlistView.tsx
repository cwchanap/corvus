import { createSignal, createResource, For, Show } from "solid-js";
import { Button } from "@repo/ui-components/button";
import { Card } from "@repo/ui-components/card";
import { Badge } from "@repo/ui-components/badge";
import { ThemeToggle } from "@repo/ui-components/theme-toggle";
import { Select } from "@repo/ui-components/select";
import { useTheme } from "../lib/theme/context.js";
import { WishlistStorage } from "../utils/storage.js";
import type { WishlistCategory } from "../types/wishlist";

interface WishlistViewProps {
  onAddNew?: () => void;
  onManageCategories?: () => void;
}

export function WishlistView(props: WishlistViewProps) {
  const theme = useTheme();
  const [selectedCategoryId, setSelectedCategoryId] = createSignal<
    string | null
  >(null);

  const [wishlistData, { refetch }] = createResource(() =>
    WishlistStorage.getWishlistData(),
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

  const deleteLink = async (itemId: string, linkId: string) => {
    await WishlistStorage.removeItemLink(itemId, linkId);
    refetch();
  };

  const handleOpenItem = (url: string) => {
    chrome.tabs.create({ url });
  };

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

      <Show when={wishlistData()}>
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
                              <div class="min-w-0 flex-1">
                                <h3
                                  class="font-medium text-sm truncate"
                                  title={item.title}
                                >
                                  {item.title}
                                </h3>

                                {/* All Links */}
                                <Show when={itemLinks.length > 0}>
                                  <div class="space-y-1 mt-1">
                                    <For each={itemLinks}>
                                      {(link) => (
                                        <div class="flex items-center gap-2 text-xs">
                                          <a
                                            href={link.url}
                                            onClick={(e) => {
                                              e.preventDefault();
                                              handleOpenItem(link.url);
                                            }}
                                            class="text-blue-600 hover:text-blue-800 underline truncate flex-1"
                                            title={link.url}
                                          >
                                            {link.description || link.url}
                                          </a>
                                          <Button
                                            size="sm"
                                            variant="destructive"
                                            onClick={() =>
                                              deleteLink(item.id, link.id)
                                            }
                                            class="h-4 px-1 text-xs"
                                            title="Delete link"
                                          >
                                            ×
                                          </Button>
                                        </div>
                                      )}
                                    </For>
                                  </div>
                                </Show>

                                <Show when={item.description}>
                                  <p class="text-xs text-muted-foreground mt-1 line-clamp-2">
                                    {item.description}
                                  </p>
                                </Show>
                              </div>

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
    </div>
  );
}
