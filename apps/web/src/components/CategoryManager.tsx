import { createSignal, For, Show } from "solid-js";
import { Button } from "@repo/ui-components/button";
import { Input } from "@repo/ui-components/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@repo/ui-components/card";
import { ConfirmDialog } from "@repo/ui-components/confirm-dialog";
import type { WishlistCategoryRecord } from "@repo/common/types/wishlist-record";
import {
  useCreateCategory,
  useDeleteCategory,
} from "../lib/graphql/hooks/use-wishlist";

interface CategoryManagerProps {
  categories: WishlistCategoryRecord[];
  onRefetch: () => Promise<void>;
  onClose?: () => void;
}

export function CategoryManager(props: CategoryManagerProps) {
  const [newCategoryName, setNewCategoryName] = createSignal("");
  const [newCategoryColor, setNewCategoryColor] = createSignal("#6366f1");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = createSignal(false);
  const [categoryToDelete, setCategoryToDelete] =
    createSignal<WishlistCategoryRecord | null>(null);
  const [error, setError] = createSignal<string | null>(null);

  const createCategoryMutation = useCreateCategory();
  const deleteCategoryMutation = useDeleteCategory();

  const handleAddCategory = async () => {
    const name = newCategoryName().trim();
    if (!name) return;

    setError(null);
    try {
      await createCategoryMutation.mutateAsync({
        name,
        color: newCategoryColor(),
      });

      setNewCategoryName("");
      setNewCategoryColor("#6366f1");
      await props.onRefetch();
    } catch (err) {
      console.error("Error adding category:", err);
      setError(err instanceof Error ? err.message : "Failed to add category");
    }
  };

  const handleDeleteClick = (category: WishlistCategoryRecord) => {
    setCategoryToDelete(category);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    const category = categoryToDelete();
    if (!category) return;

    setError(null);
    try {
      await deleteCategoryMutation.mutateAsync(category.id);

      await props.onRefetch();
      setCategoryToDelete(null);
    } catch (err) {
      console.error("Error deleting category:", err);
      setError(
        err instanceof Error ? err.message : "Failed to delete category",
      );
      setDeleteConfirmOpen(false);
    }
  };

  const randomColor = (): string => {
    const colors = [
      "#ef4444",
      "#f97316",
      "#f59e0b",
      "#eab308",
      "#84cc16",
      "#22c55e",
      "#10b981",
      "#14b8a6",
      "#06b6d4",
      "#0ea5e9",
      "#3b82f6",
      "#6366f1",
      "#8b5cf6",
      "#a855f7",
      "#d946ef",
      "#ec4899",
      "#f43f5e",
    ];
    return colors[Math.floor(Math.random() * colors.length)] ?? "#6366f1";
  };

  return (
    <>
      <Card class="w-full">
        <CardHeader>
          <div class="flex items-center justify-between">
            <CardTitle class="text-lg">Manage Categories</CardTitle>
            <Show when={props.onClose}>
              <Button variant="ghost" size="sm" onClick={props.onClose}>
                ✕
              </Button>
            </Show>
          </div>
        </CardHeader>
        <CardContent class="space-y-6">
          {/* Error Display */}
          <Show when={error()}>
            <div class="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
              {error()}
            </div>
          </Show>

          {/* Add new category */}
          <div class="space-y-3">
            <label class="text-sm font-medium">Add New Category</label>
            <div class="flex gap-2">
              <Input
                placeholder="Category name..."
                value={newCategoryName()}
                onInput={(e) => setNewCategoryName(e.currentTarget.value)}
                onKeyPress={(e) => e.key === "Enter" && handleAddCategory()}
                class="flex-1"
              />
              <input
                type="color"
                value={newCategoryColor()}
                onInput={(e) => setNewCategoryColor(e.currentTarget.value)}
                class="w-12 h-10 rounded-md border border-input cursor-pointer"
                title="Choose color"
              />
              <Button
                onClick={() => setNewCategoryColor(randomColor())}
                variant="outline"
                size="sm"
                title="Random color"
              >
                🎨
              </Button>
              <Button
                onClick={handleAddCategory}
                disabled={
                  !newCategoryName().trim() || createCategoryMutation.isPending
                }
                size="sm"
              >
                {createCategoryMutation.isPending ? "Adding..." : "Add"}
              </Button>
            </div>
          </div>

          {/* Existing categories */}
          <div class="space-y-3">
            <label class="text-sm font-medium">Existing Categories</label>
            <div class="space-y-2 max-h-96 overflow-y-auto">
              <For each={props.categories}>
                {(category) => (
                  <div class="flex items-center justify-between p-3 border border-border rounded-lg bg-card hover:bg-accent transition-colors">
                    <div class="flex items-center gap-3">
                      <div
                        class="w-4 h-4 rounded-full border border-border"
                        style={{
                          "background-color": category.color || "#6366f1",
                        }}
                      />
                      <span class="text-sm font-medium">{category.name}</span>
                    </div>
                    <div class="flex items-center gap-2">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteClick(category)}
                        class="h-8 px-3"
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                )}
              </For>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteConfirmOpen()}
        onOpenChange={setDeleteConfirmOpen}
        onConfirm={handleConfirmDelete}
        title="Delete Category"
        description={`Are you sure you want to delete "${categoryToDelete()?.name}"? Items in this category will become uncategorized.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
      />
    </>
  );
}
