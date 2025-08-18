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

export function AddToWishlist(props: AddToWishlistProps) {
  const [selectedCategoryId, setSelectedCategoryId] = createSignal("general");
  const [customDescription, setCustomDescription] = createSignal("");
  const [isLoading, setIsLoading] = createSignal(false);

  const [pageInfo] = createResource(getCurrentPageInfo);
  const [wishlistData] = createResource(WishlistStorage.getWishlistData);

  const handleAddToWishlist = async () => {
    const page = pageInfo();
    if (!page) return;

    setIsLoading(true);
    try {
      await WishlistStorage.addItem({
        title: page.title,
        url: page.url,
        description: customDescription() || undefined,
        categoryId: selectedCategoryId(),
        favicon: page.favicon,
      });

      props.onSuccess?.();
    } catch (error) {
      console.error("Error adding to wishlist:", error);
    } finally {
      setIsLoading(false);
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
                          <option value={category.id}>{category.name}</option>
                        )}
                      </For>
                    </select>
                  )}
                </Show>
              </div>

              <div class="space-y-2">
                <label class="text-sm font-medium">
                  Description (optional)
                </label>
                <textarea
                  placeholder="Add a note about this page..."
                  value={customDescription()}
                  onInput={(e) => setCustomDescription(e.currentTarget.value)}
                  class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm resize-none"
                  rows="2"
                />
              </div>

              <div class="flex gap-2 pt-2">
                <Button
                  onClick={handleAddToWishlist}
                  disabled={isLoading()}
                  class="flex-1"
                >
                  {isLoading() ? "Adding..." : "Add to Wishlist"}
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
