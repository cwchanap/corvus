import { For, Show, createEffect, createSignal } from "solid-js";
import { Portal } from "solid-js/web";
import { Button } from "@repo/ui-components/button";
import { Input } from "@repo/ui-components/input";
import { Select } from "@repo/ui-components/select";
import type { WishlistCategory } from "../lib/db/types.js";

export interface AddItemPayload {
  title: string;
  url: string;
  description?: string;
  category_id?: string;
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
  const [url, setUrl] = createSignal("");
  const [description, setDescription] = createSignal("");
  const [categoryId, setCategoryId] = createSignal<string | "">("");

  // Reset fields when the dialog opens
  createEffect(() => {
    if (props.open) {
      setTitle("");
      setUrl("");
      setDescription("");
      const initial = props.initialCategoryId ?? props.categories[0]?.id ?? "";
      setCategoryId(initial || "");
    }
  });

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    if (!title().trim() || !url().trim()) return;
    await props.onSubmit({
      title: title().trim(),
      url: url().trim(),
      description: description().trim() || undefined,
      category_id: categoryId() || undefined,
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
                      URL
                    </label>
                    <Input
                      type="url"
                      value={url()}
                      onInput={(e) => setUrl(e.currentTarget.value)}
                      placeholder="https://example.com/product"
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
