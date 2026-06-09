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
      <Card class="w-full rounded-sm">
        <CardHeader>
          <div class="flex items-center justify-between">
            <CardTitle class="font-display text-lg">
              Manage Categories
            </CardTitle>
            <Show when={props.onClose}>
              <Button
                variant="ghost"
                size="sm"
                onClick={props.onClose}
                aria-label="Close"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  aria-hidden="true"
                  class="h-4 w-4"
                >
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </Button>
            </Show>
          </div>
        </CardHeader>
        <CardContent class="space-y-6">
          {/* Error Display */}
          <Show when={error()}>
            <div class="p-3 bg-destructive/10 border border-destructive/20 rounded-sm text-sm text-destructive">
              {error()}
            </div>
          </Show>

          {/* Add new category */}
          <div class="space-y-3">
            <label class="font-mono text-xs uppercase tracking-wide text-muted-foreground">
              Add New Category
            </label>
            <div class="flex gap-2">
              <Input
                placeholder="Category name..."
                value={newCategoryName()}
                onInput={(e) => setNewCategoryName(e.currentTarget.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddCategory()}
                class="flex-1"
              />
              <input
                type="color"
                value={newCategoryColor()}
                onInput={(e) => setNewCategoryColor(e.currentTarget.value)}
                class="w-12 h-10 rounded-sm border border-input cursor-pointer"
                title="Choose color"
              />
              <Button
                onClick={() => setNewCategoryColor(randomColor())}
                variant="outline"
                size="sm"
                title="Random color"
                aria-label="Random color"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  aria-hidden="true"
                  class="h-4 w-4"
                >
                  <path d="M21.64 3.64a1 1 0 0 0-1.28 0l-2.3 2.3A9 9 0 1 0 21 12a1 1 0 0 0-2 0 7 7 0 1 1-6.23-6.94l-2.3 2.3a1 1 0 0 0 1.41 1.41l4.95-4.95a1 1 0 0 0 0-1.28z" />
                </svg>
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
            <label class="font-mono text-xs uppercase tracking-wide text-muted-foreground">
              Existing Categories
            </label>
            <div class="divide-y divide-border border border-border rounded-sm max-h-96 overflow-y-auto">
              <For each={props.categories}>
                {(category) => (
                  <div class="flex items-center justify-between p-3 bg-card hover:bg-accent transition-colors">
                    <div class="flex items-center gap-3">
                      <div
                        data-testid="category-color"
                        class="w-4 h-4 rounded-full border border-border"
                        style={{
                          "background-color": category.color || "#6366f1",
                        }}
                      />
                      <span class="font-serif text-sm">{category.name}</span>
                    </div>
                    <div class="flex items-center gap-2">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteClick(category)}
                        aria-label={`Remove ${category.name}`}
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
