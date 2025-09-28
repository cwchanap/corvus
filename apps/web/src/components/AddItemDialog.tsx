import { For, Show, createEffect, createSignal } from "solid-js";
import { Portal } from "solid-js/web";
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
  >([{ url: "", description: "", isPrimary: true }]);

  // Reset fields when the dialog opens
  createEffect(() => {
    if (props.open) {
      setTitle("");
      setDescription("");
      setLinks([{ url: "", description: "", isPrimary: true }]);
      const initial = props.initialCategoryId ?? props.categories[0]?.id ?? "";
      setCategoryId(initial || "");
    }
  });

  const addLink = () => {
    setLinks((prev) => [
      ...prev,
      { url: "", description: "", isPrimary: false },
    ]);
  };

  const removeLink = (index: number) => {
    setLinks((prev) => {
      const newLinks = prev.filter((_, i) => i !== index);
      // Ensure at least one link remains
      if (newLinks.length === 0) {
        return [{ url: "", description: "", isPrimary: true }];
      }
      // If we removed the primary link, make the first one primary
      if (prev[index]?.isPrimary && newLinks.length > 0) {
        newLinks[0]!.isPrimary = true;
      }
      return newLinks;
    });
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
    if (!title().trim() || validLinks.length === 0) return;

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
      <Portal>
        <div class="fixed inset-0 z-50">
          {/* Overlay */}
          <div
            class="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => props.onOpenChange(false)}
          />

          {/* Dialog */}
          <div class="absolute inset-0 flex items-center justify-center p-4">
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="add-item-title"
              class="w-full max-w-lg rounded-2xl border-0 bg-white/95 backdrop-blur-sm shadow-2xl"
            >
              <form onSubmit={handleSubmit}>
                <div class="px-8 pt-6 pb-4 border-b border-purple-100">
                  <h2
                    id="add-item-title"
                    class="text-2xl font-bold text-gray-800"
                  >
                    Add Wishlist Item
                  </h2>
                  <p class="mt-2 text-sm text-gray-600">
                    Provide details for the item you'd like to add.
                  </p>
                </div>

                <div class="px-8 py-6 space-y-6">
                  <div class="space-y-3">
                    <label class="block text-sm font-medium text-gray-700">
                      Title
                    </label>
                    <Input
                      value={title()}
                      onInput={(e) => setTitle(e.currentTarget.value)}
                      placeholder="Item title"
                      class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-gray-50/50 hover:bg-white"
                      required
                    />
                  </div>

                  <div class="space-y-3">
                    <label class="block text-sm font-medium text-gray-700">
                      Description (optional)
                    </label>
                    <textarea
                      class="w-full min-h-24 resize-y rounded-xl border border-gray-200 bg-gray-50/50 hover:bg-white px-4 py-3 text-sm text-gray-800 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50"
                      value={description()}
                      onInput={(e) => setDescription(e.currentTarget.value)}
                      placeholder="Notes, size, color, etc."
                    />
                  </div>

                  <Show when={props.categories?.length > 0}>
                    <div class="space-y-3">
                      <label class="block text-sm font-medium text-gray-700">
                        Category
                      </label>
                      <Select
                        value={categoryId()}
                        onChange={(e) => setCategoryId(e.currentTarget.value)}
                        class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-gray-50/50 hover:bg-white"
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
                      <label class="block text-sm font-medium text-gray-700">
                        Links
                      </label>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={addLink}
                        class="text-sm px-3 py-1"
                      >
                        + Add Link
                      </Button>
                    </div>

                    <div class="space-y-3">
                      <For each={links()}>
                        {(link, index) => (
                          <div class="border border-gray-200 rounded-lg p-4 space-y-3">
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
                                  class="rounded"
                                />
                                <label class="text-sm font-medium text-gray-600">
                                  Primary Link
                                </label>
                              </div>
                              <Show when={links().length > 1}>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  onClick={() => removeLink(index())}
                                  class="text-red-600 hover:text-red-700 text-xs p-1"
                                >
                                  Remove
                                </Button>
                              </Show>
                            </div>

                            <Input
                              type="url"
                              value={link.url}
                              onInput={(e) =>
                                updateLink(
                                  index(),
                                  "url",
                                  e.currentTarget.value,
                                )
                              }
                              placeholder="https://example.com/product"
                              class="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                              class="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            />
                          </div>
                        )}
                      </For>
                    </div>
                  </div>
                </div>

                <div class="px-8 pb-6 pt-4 flex items-center justify-end gap-3 border-t border-purple-100">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => props.onOpenChange(false)}
                    class="text-gray-600 hover:text-gray-800 hover:bg-gray-100 px-6 py-2 rounded-xl font-medium transition-all duration-200"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={props.submitting}
                    class="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-2 rounded-xl font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                  >
                    {props.submitting ? "Adding..." : "Add Item"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </Portal>
    </Show>
  );
}
