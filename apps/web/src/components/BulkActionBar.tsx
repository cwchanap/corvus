import { Show, createSignal, createEffect, onCleanup, For } from "solid-js";
import type { Accessor } from "solid-js";
import { Button } from "@repo/ui-components/button";
import { ConfirmDialog } from "@repo/ui-components/confirm-dialog";
import type { WishlistCategoryRecord } from "@repo/common/types/wishlist-record";

interface BulkActionBarProps {
  selectedCount: Accessor<number>;
  totalCount: Accessor<number>;
  allSelected: Accessor<boolean>;
  categories: Accessor<WishlistCategoryRecord[]>;
  isProcessing: boolean;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onCancel: () => void;
  onDelete: () => void;
  onMove: (categoryId: string | null) => void;
}

export function BulkActionBar(props: BulkActionBarProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = createSignal(false);
  const [showMoveDropdown, setShowMoveDropdown] = createSignal(false);

  let addOutsideClickListenerTimer: number | undefined;
  let outsideClickListenerAttached = false;

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = () => {
    props.onDelete();
    setShowDeleteConfirm(false);
  };

  const handleMoveClick = (categoryId: string | null) => {
    props.onMove(categoryId);
    hideMoveDropdown();
  };

  const clearAddOutsideClickListenerTimer = () => {
    if (addOutsideClickListenerTimer !== undefined) {
      clearTimeout(addOutsideClickListenerTimer);
      addOutsideClickListenerTimer = undefined;
    }
  };

  const detachOutsideClickListener = () => {
    if (outsideClickListenerAttached) {
      document.removeEventListener("click", handleClickOutside);
      outsideClickListenerAttached = false;
    }
  };

  function hideMoveDropdown() {
    clearAddOutsideClickListenerTimer();
    detachOutsideClickListener();
    setShowMoveDropdown(false);
  }

  function handleClickOutside(e: MouseEvent) {
    const target = e.target as Element;
    if (!target.closest(".move-dropdown-container")) {
      hideMoveDropdown();
    }
  }

  // Close dropdown when clicking outside
  createEffect(() => {
    if (!showMoveDropdown()) {
      clearAddOutsideClickListenerTimer();
      detachOutsideClickListener();
      return;
    }

    clearAddOutsideClickListenerTimer();
    addOutsideClickListenerTimer = window.setTimeout(() => {
      if (!showMoveDropdown()) {
        return;
      }

      if (!outsideClickListenerAttached) {
        document.addEventListener("click", handleClickOutside);
        outsideClickListenerAttached = true;
      }
    }, 0);

    onCleanup(() => {
      clearAddOutsideClickListenerTimer();
      detachOutsideClickListener();
    });
  });

  onCleanup(() => {
    clearAddOutsideClickListenerTimer();
    detachOutsideClickListener();
  });

  return (
    <>
      <Show when={props.selectedCount() > 0}>
        <div class="fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-sm border-t border-border shadow-2xl">
          <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div class="flex flex-col sm:flex-row items-center gap-4 justify-between">
              {/* Left: Selection Info */}
              <div class="flex items-center gap-3">
                <div class="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                  <span class="text-primary font-semibold">
                    {props.selectedCount()}
                  </span>
                </div>
                <span class="text-foreground font-medium">
                  {props.selectedCount() === 1 ? "item" : "items"} selected
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={props.onSelectAll}
                  disabled={props.isProcessing}
                >
                  {props.allSelected()
                    ? "Deselect All"
                    : `Select All (${props.totalCount()})`}
                </Button>
              </div>

              {/* Right: Actions */}
              <div class="flex items-center gap-3">
                {/* Move Dropdown */}
                <div class="relative move-dropdown-container">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (showMoveDropdown()) {
                        hideMoveDropdown();
                        return;
                      }

                      clearAddOutsideClickListenerTimer();
                      setShowMoveDropdown(true);
                    }}
                    disabled={props.isProcessing}
                    class="whitespace-nowrap"
                  >
                    Move to...
                  </Button>
                  <Show when={showMoveDropdown()}>
                    <div class="absolute bottom-full mb-2 right-0 w-56 bg-card border border-border rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
                      <div class="py-1">
                        <button
                          onClick={() => handleMoveClick(null)}
                          class="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                        >
                          Uncategorized
                        </button>
                        <For each={props.categories()}>
                          {(category) => (
                            <button
                              onClick={() => handleMoveClick(category.id)}
                              class="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                            >
                              <div class="flex items-center gap-2">
                                <div
                                  class="w-3 h-3 rounded-full"
                                  style={{
                                    "background-color":
                                      category.color || "#6366f1",
                                  }}
                                />
                                <span>{category.name}</span>
                              </div>
                            </button>
                          )}
                        </For>
                      </div>
                    </div>
                  </Show>
                </div>

                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDeleteClick}
                  disabled={props.isProcessing}
                  class="whitespace-nowrap"
                >
                  {props.isProcessing ? "Deleting..." : "Delete Selected"}
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={props.onCancel}
                  disabled={props.isProcessing}
                  class="whitespace-nowrap"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Show>

      <ConfirmDialog
        open={showDeleteConfirm()}
        onOpenChange={setShowDeleteConfirm}
        onConfirm={handleConfirmDelete}
        title="Delete Selected Items"
        description={`Are you sure you want to delete ${props.selectedCount()} ${props.selectedCount() === 1 ? "item" : "items"}? This action cannot be undone.`}
        confirmText="Delete"
        variant="destructive"
      />
    </>
  );
}
