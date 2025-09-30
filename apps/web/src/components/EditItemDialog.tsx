import { createSignal, createEffect, For, Show } from "solid-js";
import { Button } from "@repo/ui-components/button";
import { Input } from "@repo/ui-components/input";
import { Select } from "@repo/ui-components/select";
import type {
  WishlistCategory,
  WishlistItemWithLinks,
} from "../lib/db/types.js";

interface EditItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: {
    id: string;
    title: string;
    description?: string;
    category_id: string;
    links: Array<{
      id?: string;
      url: string;
      description?: string;
      isPrimary?: boolean;
      isNew?: boolean;
      isDeleted?: boolean;
    }>;
  }) => void;
  categories: WishlistCategory[];
  item: WishlistItemWithLinks | null;
  submitting?: boolean;
}

export function EditItemDialog(props: EditItemDialogProps) {
  const [title, setTitle] = createSignal("");
  const [description, setDescription] = createSignal("");
  const [categoryId, setCategoryId] = createSignal("");
  const [links, setLinks] = createSignal<
    Array<{
      id?: string;
      url: string;
      description?: string;
      isPrimary: boolean;
      isNew?: boolean;
      isDeleted?: boolean;
    }>
  >([]);

  // Reset form when dialog opens/closes or item changes
  createEffect(() => {
    if (props.open && props.item) {
      setTitle(props.item.title);
      setDescription(props.item.description || "");
      setCategoryId(props.item.category_id);

      // Convert existing links
      const existingLinks = (props.item.links || []).map((link) => ({
        id: link.id,
        url: link.url,
        description: link.description || "",
        isPrimary: link.is_primary,
        isNew: false,
        isDeleted: false,
      }));

      setLinks(existingLinks);
    } else if (!props.open) {
      // Reset form
      setTitle("");
      setDescription("");
      setCategoryId("");
      setLinks([]);
    }
  });

  const addLink = () => {
    setLinks((prev) => [
      ...prev,
      {
        url: "",
        description: "",
        isPrimary: prev.length === 0,
        isNew: true,
        isDeleted: false,
      },
    ]);
  };

  const updateLink = (
    index: number,
    updates: Partial<{
      url: string;
      description: string;
      isPrimary: boolean;
    }>,
  ) => {
    setLinks((prev) =>
      prev.map((link, i) => (i === index ? { ...link, ...updates } : link)),
    );
  };

  const removeLink = (index: number) => {
    setLinks((prev) => {
      const link = prev[index];
      if (link?.isNew) {
        // Remove new links entirely
        return prev.filter((_, i) => i !== index);
      } else {
        // Mark existing links as deleted
        return prev.map((l, i) =>
          i === index ? { ...l, isDeleted: true } : l,
        );
      }
    });
  };

  const removeAllLinks = () => {
    setLinks(
      (prev) =>
        prev
          .map((link) => (link.isNew ? null : { ...link, isDeleted: true }))
          .filter(Boolean) as typeof prev,
    );
  };

  const setPrimary = (index: number) => {
    setLinks((prev) =>
      prev.map((link, i) => ({
        ...link,
        isPrimary: i === index,
      })),
    );
  };

  const handleSubmit = (e: Event) => {
    e.preventDefault();

    if (!props.item) return;

    const activeLinks = links().filter((link) => !link.isDeleted);

    props.onSubmit({
      id: props.item.id,
      title: title().trim(),
      description: description().trim() || undefined,
      category_id: categoryId(),
      links: activeLinks.map((link) => ({
        id: link.id,
        url: link.url.trim(),
        description: link.description?.trim() || undefined,
        isPrimary: link.isPrimary,
        isNew: link.isNew,
        isDeleted: link.isDeleted,
      })),
    });
  };

  const visibleLinks = () => links().filter((link) => !link.isDeleted);
  const hasVisibleLinks = () => visibleLinks().length > 0;

  return (
    <Show when={props.open}>
      <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div class="bg-card rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div class="p-6">
            <div class="flex items-center justify-between mb-6">
              <h2 class="text-xl font-semibold text-card-foreground">
                Edit Wishlist Item
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => props.onOpenChange(false)}
                class="text-muted-foreground hover:text-foreground"
              >
                ×
              </Button>
            </div>

            <form onSubmit={handleSubmit} class="space-y-6">
              {/* Title */}
              <div class="space-y-2">
                <label class="text-sm font-medium text-foreground">Title</label>
                <Input
                  type="text"
                  placeholder="Item title"
                  value={title()}
                  onInput={(e) => setTitle(e.currentTarget.value)}
                  required
                  class="w-full"
                />
              </div>

              {/* Description */}
              <div class="space-y-2">
                <label class="text-sm font-medium text-foreground">
                  Description (optional)
                </label>
                <textarea
                  placeholder="Notes, size, color, etc."
                  value={description()}
                  onInput={(e) => setDescription(e.currentTarget.value)}
                  class="w-full min-h-[80px] px-3 py-2 border border-input bg-background text-foreground rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                />
              </div>

              {/* Category */}
              <div class="space-y-2">
                <label class="text-sm font-medium text-foreground">
                  Category
                </label>
                <Select
                  value={categoryId()}
                  onChange={(e) => setCategoryId(e.currentTarget.value)}
                  class="w-full"
                >
                  <For each={props.categories}>
                    {(category) => (
                      <option value={category.id}>{category.name}</option>
                    )}
                  </For>
                </Select>
              </div>

              {/* Links Section */}
              <div class="space-y-4">
                <div class="flex items-center justify-between">
                  <label class="text-sm font-medium text-foreground">
                    Links (optional)
                  </label>
                  <div class="flex gap-2">
                    <Show when={hasVisibleLinks()}>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={removeAllLinks}
                        class="text-xs"
                      >
                        Remove All
                      </Button>
                    </Show>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addLink}
                      class="text-xs"
                    >
                      + Add Link
                    </Button>
                  </div>
                </div>

                <Show
                  when={hasVisibleLinks()}
                  fallback={
                    <div class="text-center py-6 text-muted-foreground space-y-2">
                      <p class="text-sm">No links added yet</p>
                      <p class="text-xs">
                        You can add links now or later after updating the item
                      </p>
                    </div>
                  }
                >
                  <div class="space-y-3">
                    <For each={visibleLinks()}>
                      {(link, index) => (
                        <div class="border border-border rounded-lg p-4 space-y-3 bg-muted/20">
                          <div class="flex items-center justify-between">
                            <div class="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={link.isPrimary}
                                onChange={() => setPrimary(index())}
                                class="w-4 h-4 text-primary bg-background border-border rounded focus:ring-primary focus:ring-2"
                              />
                              <span class="text-sm font-medium">
                                Primary Link
                              </span>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeLink(index())}
                              class="text-destructive hover:text-destructive text-xs"
                            >
                              Remove
                            </Button>
                          </div>

                          <Input
                            type="url"
                            placeholder="Enter website URL"
                            value={link.url}
                            onInput={(e) =>
                              updateLink(index(), {
                                url: e.currentTarget.value,
                              })
                            }
                            required
                            class="w-full"
                          />

                          <Input
                            type="text"
                            placeholder="Link description (optional)"
                            value={link.description || ""}
                            onInput={(e) =>
                              updateLink(index(), {
                                description: e.currentTarget.value,
                              })
                            }
                            class="w-full"
                          />
                        </div>
                      )}
                    </For>
                  </div>
                </Show>
              </div>

              {/* Submit Actions */}
              <div class="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => props.onOpenChange(false)}
                  class="flex-1"
                  disabled={props.submitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  class="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                  disabled={props.submitting || !title().trim()}
                >
                  {props.submitting ? "Updating..." : "Update Item"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Show>
  );
}
