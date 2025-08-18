import { createSignal, createResource, For, Show } from "solid-js";
import { Button } from "@repo/ui-components/button";
import { Input } from "@repo/ui-components/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@repo/ui-components/card";
import { Badge } from "@repo/ui-components/badge";
import { WishlistStorage } from "../utils/storage.js";

interface CategoryManagerProps {
  onClose?: () => void;
}

export function CategoryManager(props: CategoryManagerProps) {
  const [newCategoryName, setNewCategoryName] = createSignal("");
  const [isAdding, setIsAdding] = createSignal(false);

  const [wishlistData, { refetch }] = createResource(
    WishlistStorage.getWishlistData,
  );

  const handleAddCategory = async () => {
    const name = newCategoryName().trim();
    if (!name) return;

    setIsAdding(true);
    try {
      await WishlistStorage.addCategory({
        name,
        color: `#${Math.floor(Math.random() * 16777215).toString(16)}`, // Random color
      });
      setNewCategoryName("");
      refetch();
    } catch (error) {
      console.error("Error adding category:", error);
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemoveCategory = async (categoryId: string) => {
    try {
      await WishlistStorage.removeCategory(categoryId);
      refetch();
    } catch (error) {
      console.error("Error removing category:", error);
      alert(
        error instanceof Error ? error.message : "Failed to remove category",
      );
    }
  };

  const getItemCount = (categoryId: string): number => {
    return (
      wishlistData()?.items.filter((item) => item.categoryId === categoryId)
        .length || 0
    );
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
              disabled={!newCategoryName().trim() || isAdding()}
              size="sm"
            >
              {isAdding() ? "Adding..." : "Add"}
            </Button>
          </div>
        </div>

        {/* Existing categories */}
        <div class="space-y-2">
          <label class="text-sm font-medium">Existing Categories</label>
          <Show when={wishlistData()}>
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
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveCategory(category.id)}
                            class="text-destructive hover:text-destructive h-6 px-2"
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
