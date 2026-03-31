import { For, Show, createEffect, createSignal } from "solid-js";
import { Button } from "@repo/ui-components/button";
import { Input } from "@repo/ui-components/input";
import { Select } from "@repo/ui-components/select";
import type { WishlistCategoryRecord } from "@repo/common/types/wishlist-record";
import { LinkManager } from "./LinkManager";
import { useLinkManager, type LinkItem } from "./useLinkManager";
import { useDuplicateUrlCheck } from "./useDuplicateUrlCheck";

export interface AddItemPayload {
  title: string;
  description?: string;
  category_id?: string;
  priority?: number;
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
  categories: WishlistCategoryRecord[];
  initialCategoryId?: string | null;
  submitting?: boolean;
}

export function AddItemDialog(props: AddItemDialogProps) {
  const [title, setTitle] = createSignal("");
  const [description, setDescription] = createSignal("");
  const [categoryId, setCategoryId] = createSignal<string | "">("");
  const [priority, setPriority] = createSignal<string>("");
  const linkManager = useLinkManager();
  const duplicateUrlCheck = useDuplicateUrlCheck({
    links: linkManager.links,
    updateLink: linkManager.updateLink,
  });

  // Reset fields when the dialog opens
  createEffect(() => {
    if (props.open) {
      setTitle("");
      setDescription("");
      setPriority("");
      duplicateUrlCheck.reset();
      linkManager.resetLinks([]);
      const initial = props.initialCategoryId ?? props.categories[0]?.id ?? "";
      setCategoryId(initial || "");
    } else {
      duplicateUrlCheck.cleanup();
    }
  });

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    const validLinks = linkManager
      .links()
      .filter((link: LinkItem) => link.url.trim());
    if (!title().trim()) return;

    const parsedPriority = priority() ? parseInt(priority(), 10) : undefined;

    await props.onSubmit({
      title: title().trim(),
      description: description().trim() || undefined,
      category_id: categoryId() || undefined,
      priority:
        parsedPriority && parsedPriority >= 1 && parsedPriority <= 5
          ? parsedPriority
          : undefined,
      links: validLinks.map((link: LinkItem) => ({
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

              {/* Priority */}
              <div class="space-y-3">
                <label class="block text-sm font-medium text-foreground">
                  Priority (optional)
                </label>
                <Select
                  value={priority()}
                  onChange={(e) => setPriority(e.currentTarget.value)}
                  class="w-full px-4 py-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200 bg-background text-foreground"
                >
                  <option value="">Unset</option>
                  <option value="1">1 — Highest</option>
                  <option value="2">2 — High</option>
                  <option value="3">3 — Medium</option>
                  <option value="4">4 — Low</option>
                  <option value="5">5 — Lowest</option>
                </Select>
              </div>

              {/* Links Section */}
              <LinkManager
                links={linkManager.links()}
                onAddLink={linkManager.addLink}
                onUpdateLink={(index, field, value) => {
                  if (field === "url") {
                    duplicateUrlCheck.handleUrlChange(index, value as string);
                  } else {
                    linkManager.updateLink(index, field, value);
                  }
                }}
                onRemoveLink={linkManager.removeLink}
                onRemoveAllLinks={linkManager.removeAllLinks}
                emptyMessage="No links added yet"
                emptySubMessage="You can add links now or later after creating the item"
                duplicateWarnings={duplicateUrlCheck.duplicateWarnings()}
              />

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
