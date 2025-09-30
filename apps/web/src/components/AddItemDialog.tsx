import { For, Show, createEffect, createSignal } from "solid-js";
import { Button } from "@repo/ui-components/button";
import { Input } from "@repo/ui-components/input";
import { Select } from "@repo/ui-components/select";
import type { WishlistCategory } from "../lib/db/types.js";

export interface AddItemPayload {
  title: string;
  description?: string;
  category_id?: string;
  links: Array<{
    url: string;
    description?: string;
    isPrimary?: boolean;
  }>;
}

interface AddItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: AddItemPayload) => Promise<void> | void;
  categories: WishlistCategory[];
  initialCategoryId?: string | null;
  submitting?: boolean;
}

export function AddItemDialog(props: AddItemDialogProps) {
  const [title, setTitle] = createSignal("");
  const [description, setDescription] = createSignal("");
  const [categoryId, setCategoryId] = createSignal<string | "">("");
  const [links, setLinks] = createSignal<
    Array<{ url: string; description: string; isPrimary: boolean }>
  >([]);

  // Reset fields when the dialog opens
  createEffect(() => {
    if (props.open) {
      setTitle("");
      setDescription("");
      setLinks([]);
      const initial = props.initialCategoryId ?? props.categories[0]?.id ?? "";
      setCategoryId(initial || "");
    }
  });

  const addLink = () => {
    setLinks((prev) => {
      const isFirstLink = prev.length === 0;
      return [...prev, { url: "", description: "", isPrimary: isFirstLink }];
    });
  };

  const removeLink = (index: number) => {
    setLinks((prev) => {
      const newLinks = prev.filter((_, i) => i !== index);
      // If we removed the primary link and there are remaining links, make the first one primary
      if (prev[index]?.isPrimary && newLinks.length > 0) {
        newLinks[0]!.isPrimary = true;
      }
      return newLinks;
    });
  };

  const removeAllLinks = () => {
    setLinks([]);
  };

  const updateLink = (
    index: number,
    field: "url" | "description" | "isPrimary",
    value: string | boolean,
  ) => {
    setLinks((prev) =>
      prev.map((link, i) => {
        if (i === index) {
          // If setting as primary, unset others
          if (field === "isPrimary" && value === true) {
            return { ...link, [field]: value };
          }
          return { ...link, [field]: value };
        } else if (field === "isPrimary" && value === true) {
          // Unset primary for other links
          return { ...link, isPrimary: false };
        }
        return link;
      }),
    );
  };

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    const validLinks = links().filter((link) => link.url.trim());
    if (!title().trim()) return;

    await props.onSubmit({
      title: title().trim(),
      description: description().trim() || undefined,
      category_id: categoryId() || undefined,
      links: validLinks.map((link) => ({
        url: link.url.trim(),
        description: link.description.trim() || undefined,
        isPrimary: link.isPrimary,
      })),
    });
  };

  return (
    <Show when={props.open}>
      <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div class="bg-card rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div class="p-6">
            <div class="flex items-center justify-between mb-6">
              <div>
                <h2 class="text-xl font-semibold text-card-foreground">
                  Add Wishlist Item
                </h2>
                <p class="mt-1 text-sm text-muted-foreground">
                  Provide details for the item you'd like to add.
                </p>
              </div>
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
              <div class="space-y-3">
                <label class="block text-sm font-medium text-foreground">
                  Title
                </label>
                <Input
                  value={title()}
                  onInput={(e) => setTitle(e.currentTarget.value)}
                  placeholder="Item title"
                  class="w-full px-4 py-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200 bg-background text-foreground placeholder:text-muted-foreground"
                  required
                />
              </div>

              <div class="space-y-3">
                <label class="block text-sm font-medium text-foreground">
                  Description (optional)
                </label>
                <textarea
                  class="w-full min-h-24 resize-y rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50"
                  value={description()}
                  onInput={(e) => setDescription(e.currentTarget.value)}
                  placeholder="Notes, size, color, etc."
                />
              </div>

              <Show when={props.categories?.length > 0}>
                <div class="space-y-3">
                  <label class="block text-sm font-medium text-foreground">
                    Category
                  </label>
                  <Select
                    value={categoryId()}
                    onChange={(e) => setCategoryId(e.currentTarget.value)}
                    class="w-full px-4 py-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200 bg-background text-foreground"
                  >
                    <For each={props.categories}>
                      {(c) => <option value={c.id}>{c.name}</option>}
                    </For>
                  </Select>
                </div>
              </Show>

              {/* Links Section */}
              <div class="space-y-3">
                <div class="flex items-center justify-between">
                  <label class="block text-sm font-medium text-foreground">
                    Links (optional)
                  </label>
                  <div class="flex gap-2">
                    <Show when={links().length > 0}>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={removeAllLinks}
                        class="text-xs px-2 py-1 text-muted-foreground hover:text-destructive"
                      >
                        Remove All
                      </Button>
                    </Show>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addLink}
                      class="text-sm px-3 py-1 border-border text-foreground hover:bg-muted"
                    >
                      + Add Link
                    </Button>
                  </div>
                </div>

                <Show
                  when={links().length > 0}
                  fallback={
                    <div class="text-center py-8 text-muted-foreground">
                      <p class="text-sm">No links added yet</p>
                      <p class="text-xs mt-1">
                        You can add links now or later after creating the item
                      </p>
                    </div>
                  }
                >
                  <div class="space-y-3">
                    <For each={links()}>
                      {(link, index) => (
                        <div class="border border-border bg-muted/30 rounded-lg p-4 space-y-3">
                          <div class="flex items-center justify-between">
                            <div class="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={link.isPrimary}
                                onChange={(e) =>
                                  updateLink(
                                    index(),
                                    "isPrimary",
                                    e.currentTarget.checked,
                                  )
                                }
                                class="rounded border-border accent-primary"
                              />
                              <label class="text-sm font-medium text-foreground">
                                Primary Link
                              </label>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              onClick={() => removeLink(index())}
                              class="text-destructive hover:text-destructive hover:bg-destructive/10 text-xs p-1"
                            >
                              Remove
                            </Button>
                          </div>

                          <Input
                            type="url"
                            value={link.url}
                            onInput={(e) =>
                              updateLink(index(), "url", e.currentTarget.value)
                            }
                            placeholder="Enter website URL"
                            class="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                            required
                          />

                          <Input
                            value={link.description}
                            onInput={(e) =>
                              updateLink(
                                index(),
                                "description",
                                e.currentTarget.value,
                              )
                            }
                            placeholder="Link description (optional)"
                            class="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
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
                  {props.submitting ? "Adding..." : "Add Item"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Show>
  );
}
