import { createSignal, createResource, For, Show } from "solid-js";
import { Button } from "@repo/ui-components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@repo/ui-components/card";
import { WishlistStorage } from "../utils/storage.js";
import { getCurrentPageInfo } from "../utils/page-info.js";

interface AddToWishlistProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

type AddMode = "new-item" | "existing-item" | "new-category";

export function AddToWishlist(props: AddToWishlistProps) {
  const [mode, setMode] = createSignal<AddMode>("new-item");
  const [selectedCategoryId, setSelectedCategoryId] = createSignal("general");
  const [selectedItemId, setSelectedItemId] = createSignal<string>("");
  const [customTitle, setCustomTitle] = createSignal("");
  const [customDescription, setCustomDescription] = createSignal("");
  const [linkDescription, setLinkDescription] = createSignal("");
  const [isLoading, setIsLoading] = createSignal(false);

  const [pageInfo] = createResource(getCurrentPageInfo);
  const [wishlistData] = createResource(WishlistStorage.getWishlistData);

  const filteredItems = () => {
    const data = wishlistData();
    if (!data) return [];

    const selectedCat = selectedCategoryId();
    if (!selectedCat || selectedCat === "all") return data.items;

    return data.items.filter((item) => item.categoryId === selectedCat);
  };

  const handleAddToExistingItem = async () => {
    const page = pageInfo();
    const itemId = selectedItemId();
    if (!page || !itemId) return;

    setIsLoading(true);
    try {
      await WishlistStorage.addItemLink(
        itemId,
        page.url,
        linkDescription() || undefined,
        false, // Not primary by default when adding to existing item
      );
      props.onSuccess?.();
    } catch (error) {
      console.error("Error adding link to existing item:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateNewItem = async () => {
    const page = pageInfo();
    if (!page) return;

    setIsLoading(true);
    try {
      const title = customTitle() || page.title;
      const description = customDescription() || undefined;

      await WishlistStorage.addItemWithLink(
        {
          title,
          description,
          categoryId: selectedCategoryId(),
          favicon: page.favicon,
        },
        page.url,
        linkDescription() || undefined,
      );

      props.onSuccess?.();
    } catch (error) {
      console.error("Error creating new item:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (mode() === "existing-item") {
      await handleAddToExistingItem();
    } else {
      await handleCreateNewItem();
    }
  };

  return (
    <Card class="w-full">
      <CardHeader>
        <CardTitle class="text-base">Add to Wishlist</CardTitle>
      </CardHeader>
      <CardContent class="space-y-4">
        <Show
          when={pageInfo()}
          fallback={
            <div class="text-sm text-muted-foreground">
              Loading page info...
            </div>
          }
        >
          {(page) => (
            <>
              {/* Page Info Display */}
              <div class="space-y-2">
                <div class="flex items-start gap-2">
                  <Show when={page().favicon}>
                    <img
                      src={page().favicon}
                      alt=""
                      class="w-4 h-4 mt-0.5 flex-shrink-0"
                    />
                  </Show>
                  <div class="min-w-0 flex-1">
                    <div
                      class="font-medium text-sm truncate"
                      title={page().title}
                    >
                      {page().title}
                    </div>
                    <div
                      class="text-xs text-muted-foreground truncate"
                      title={page().url}
                    >
                      {page().url}
                    </div>
                  </div>
                </div>
              </div>

              {/* Mode Selection */}
              <div class="space-y-2">
                <label class="text-sm font-medium">Action</label>
                <div class="flex gap-2">
                  <Button
                    size="sm"
                    variant={mode() === "new-item" ? "default" : "outline"}
                    onClick={() => setMode("new-item")}
                  >
                    New Item
                  </Button>
                  <Button
                    size="sm"
                    variant={mode() === "existing-item" ? "default" : "outline"}
                    onClick={() => setMode("existing-item")}
                  >
                    Add to Existing
                  </Button>
                </div>
              </div>

              <Show when={mode() === "new-item"}>
                {/* New Item Form */}
                <div class="space-y-3">
                  <div class="space-y-2">
                    <label class="text-sm font-medium">Category</label>
                    <Show when={wishlistData()}>
                      {(data) => (
                        <select
                          value={selectedCategoryId()}
                          onChange={(e) =>
                            setSelectedCategoryId(e.currentTarget.value)
                          }
                          class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        >
                          <For each={data().categories}>
                            {(category) => (
                              <option value={category.id}>
                                {category.name}
                              </option>
                            )}
                          </For>
                        </select>
                      )}
                    </Show>
                  </div>

                  <div class="space-y-2">
                    <label class="text-sm font-medium">
                      Title (optional - uses page title)
                    </label>
                    <input
                      type="text"
                      placeholder={page().title}
                      value={customTitle()}
                      onInput={(e) => setCustomTitle(e.currentTarget.value)}
                      class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                  </div>

                  <div class="space-y-2">
                    <label class="text-sm font-medium">
                      Description (optional)
                    </label>
                    <textarea
                      placeholder="Add a note about this item..."
                      value={customDescription()}
                      onInput={(e) =>
                        setCustomDescription(e.currentTarget.value)
                      }
                      class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm resize-none"
                      rows="2"
                    />
                  </div>

                  <div class="space-y-2">
                    <label class="text-sm font-medium">
                      Link Description (optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., 'Official site', 'Product page'..."
                      value={linkDescription()}
                      onInput={(e) => setLinkDescription(e.currentTarget.value)}
                      class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                  </div>
                </div>
              </Show>

              <Show when={mode() === "existing-item"}>
                {/* Add to Existing Item Form */}
                <div class="space-y-3">
                  <div class="space-y-2">
                    <label class="text-sm font-medium">Category Filter</label>
                    <Show when={wishlistData()}>
                      {(data) => (
                        <select
                          value={selectedCategoryId()}
                          onChange={(e) =>
                            setSelectedCategoryId(e.currentTarget.value)
                          }
                          class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        >
                          <option value="all">All Categories</option>
                          <For each={data().categories}>
                            {(category) => (
                              <option value={category.id}>
                                {category.name}
                              </option>
                            )}
                          </For>
                        </select>
                      )}
                    </Show>
                  </div>

                  <div class="space-y-2">
                    <label class="text-sm font-medium">Select Item</label>
                    <select
                      value={selectedItemId()}
                      onChange={(e) => setSelectedItemId(e.currentTarget.value)}
                      class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    >
                      <option value="">Choose an item...</option>
                      <For each={filteredItems()}>
                        {(item) => (
                          <option value={item.id}>
                            {item.title} ({item.links?.length || 0} links)
                          </option>
                        )}
                      </For>
                    </select>
                  </div>

                  <div class="space-y-2">
                    <label class="text-sm font-medium">
                      Link Description (optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., 'Alternative link', 'Updated version'..."
                      value={linkDescription()}
                      onInput={(e) => setLinkDescription(e.currentTarget.value)}
                      class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                  </div>
                </div>
              </Show>

              <div class="flex gap-2 pt-2">
                <Button
                  onClick={handleSubmit}
                  disabled={
                    isLoading() ||
                    (mode() === "existing-item" && !selectedItemId())
                  }
                  class="flex-1"
                >
                  {isLoading()
                    ? "Adding..."
                    : mode() === "existing-item"
                      ? "Add Link"
                      : "Create Item"}
                </Button>
                <Show when={props.onCancel}>
                  <Button
                    variant="outline"
                    onClick={props.onCancel}
                    disabled={isLoading()}
                  >
                    Cancel
                  </Button>
                </Show>
              </div>
            </>
          )}
        </Show>
      </CardContent>
    </Card>
  );
}
