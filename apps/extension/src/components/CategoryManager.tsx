import { createSignal, For, Show } from "solid-js";
import { Button } from "@repo/ui-components/button";
import { Input } from "@repo/ui-components/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@repo/ui-components/card";
import { Badge } from "@repo/ui-components/badge";
import { WishlistApiError } from "@repo/common/api/wishlist-client";
import { useWishlistData } from "../lib/wishlist/context.js";

interface CategoryManagerProps {
  onClose?: () => void;
}

export function CategoryManager(props: CategoryManagerProps) {
  const [newCategoryName, setNewCategoryName] = createSignal("");
  const [isAdding, setIsAdding] = createSignal(false);
  const {
    value: wishlistValue,
    state: wishlistState,
    error: wishlistError,
    refetch,
    api: wishlistApi,
  } = useWishlistData();

  const isErrored = () => wishlistState() === "errored";
  const resolvedWishlist = () => wishlistValue();
  const errorMessage = () => {
    const error = wishlistError();
    if (error instanceof WishlistApiError) return error.message;
    if (error instanceof Error) return error.message;
    return "Unable to load categories. Please sign in.";
  };

  const handleAddCategory = async () => {
    const name = newCategoryName().trim();
    if (!name) return;

    setIsAdding(true);
    try {
      await wishlistApi.createCategory({
        name,
        color: `#${Math.floor(Math.random() * 16777215).toString(16)}`, // Random color
      });
      setNewCategoryName("");
      await refetch();
    } catch (error) {
      console.error("Error adding category:", error);
      if (error instanceof WishlistApiError) {
        alert(error.message);
      } else if (error instanceof Error) {
        alert(error.message);
      } else {
        alert("Failed to add category");
      }
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemoveCategory = async (categoryId: string) => {
    try {
      await wishlistApi.deleteCategory(categoryId);
      await refetch();
    } catch (error) {
      console.error("Error removing category:", error);
      alert(
        error instanceof WishlistApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : "Failed to remove category",
      );
    }
  };

  const getItemCount = (categoryId: string): number => {
    const data = resolvedWishlist();
    if (!data) return 0;
    return data.items.filter((item) => item.categoryId === categoryId).length;
  };

  return (
    <Card class="w-full">
      <CardHeader>
        <div class="flex items-center justify-between">
          <CardTitle class="text-base">Manage Categories</CardTitle>
          <Show when={props.onClose}>
            <Button variant="ghost" size="sm" onClick={props.onClose}>
              ✕
            </Button>
          </Show>
        </div>
      </CardHeader>
      <CardContent class="space-y-4">
        {/* Add new category */}
        <div class="space-y-2">
          <label class="text-sm font-medium">Add New Category</label>
          <div class="flex gap-2">
            <Input
              placeholder="Category name..."
              value={newCategoryName()}
              onInput={(e) => setNewCategoryName(e.currentTarget.value)}
              onKeyPress={(e) => e.key === "Enter" && handleAddCategory()}
            />
            <Button
              onClick={handleAddCategory}
              disabled={!newCategoryName().trim() || isAdding() || isErrored()}
              size="sm"
            >
              {isAdding() ? "Adding..." : "Add"}
            </Button>
          </div>
        </div>

        {/* Existing categories */}
        <div class="space-y-2">
          <label class="text-sm font-medium">Existing Categories</label>
          <Show
            when={resolvedWishlist()}
            fallback={
              <div class="text-sm text-muted-foreground">
                {isErrored() ? errorMessage() : "Loading…"}
              </div>
            }
          >
            {(data) => (
              <div class="space-y-2 max-h-48 overflow-y-auto">
                <For each={data().categories}>
                  {(category) => {
                    const itemCount = getItemCount(category.id);
                    return (
                      <div class="flex items-center justify-between p-2 border rounded">
                        <div class="flex items-center gap-2">
                          <div
                            class="w-3 h-3 rounded-full"
                            style={{ "background-color": category.color }}
                          />
                          <span class="text-sm font-medium">
                            {category.name}
                          </span>
                          <Badge variant="secondary" class="text-xs">
                            {itemCount} items
                          </Badge>
                        </div>
                        <Show when={data().categories.length > 1}>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleRemoveCategory(category.id)}
                            class="h-6 px-2"
                          >
                            Remove
                          </Button>
                        </Show>
                      </div>
                    );
                  }}
                </For>
              </div>
            )}
          </Show>
        </div>
      </CardContent>
    </Card>
  );
}
