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
              class="w-full max-w-lg rounded-lg border border-border bg-card shadow-xl"
            >
              <form onSubmit={handleSubmit}>
                <div class="px-6 pt-5 pb-2 border-b border-border">
                  <h2
                    id="add-item-title"
                    class="text-lg font-semibold text-foreground"
                  >
                    Add Wishlist Item
                  </h2>
                  <p class="mt-1 text-sm text-muted-foreground">
                    Provide details for the item you'd like to add.
                  </p>
                </div>

                <div class="px-6 py-4 space-y-4">
                  <div class="space-y-2">
                    <label class="text-sm font-medium text-foreground">
                      Title
                    </label>
                    <Input
                      value={title()}
                      onInput={(e) => setTitle(e.currentTarget.value)}
                      placeholder="Item title"
                      required
                    />
                  </div>

                  <div class="space-y-2">
                    <label class="text-sm font-medium text-foreground">
                      URL
                    </label>
                    <Input
                      type="url"
                      value={url()}
                      onInput={(e) => setUrl(e.currentTarget.value)}
                      placeholder="https://example.com/product"
                      required
                    />
                  </div>

                  <div class="space-y-2">
                    <label class="text-sm font-medium text-foreground">
                      Description (optional)
                    </label>
                    <textarea
                      class="w-full min-h-24 resize-y rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={description()}
                      onInput={(e) => setDescription(e.currentTarget.value)}
                      placeholder="Notes, size, color, etc."
                    />
                  </div>

                  <Show when={props.categories?.length > 0}>
                    <div class="space-y-2">
                      <label class="text-sm font-medium text-foreground">
                        Category
                      </label>
                      <Select
                        value={categoryId()}
                        onChange={(e) => setCategoryId(e.currentTarget.value)}
                      >
                        <For each={props.categories}>
                          {(c) => <option value={c.id}>{c.name}</option>}
                        </For>
                      </Select>
                    </div>
                  </Show>
                </div>

                <div class="px-6 pb-5 pt-3 flex items-center justify-end gap-2 border-t border-border">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => props.onOpenChange(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={props.submitting}>
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
