import { createSignal, createEffect, For, Show } from "solid-js";
import { Button } from "@repo/ui-components/button";
import { Input } from "@repo/ui-components/input";
import { Select } from "@repo/ui-components/select";
import type {
  WishlistCategoryRecord,
  WishlistItemRecord,
  WishlistItemStatus,
} from "@repo/common/types/wishlist-record";
import { LinkManager } from "./LinkManager";
import { useLinkManager, type LinkItem } from "./useLinkManager";
import { useDuplicateUrlCheck } from "./useDuplicateUrlCheck";

interface EditItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: {
    id: string;
    title: string;
    description?: string;
    category_id?: string | null;
    status: WishlistItemStatus;
    priority?: number;
    links: Array<{
      id?: string;
      url: string;
      description?: string;
      isPrimary?: boolean;
      isNew?: boolean;
      isDeleted?: boolean;
    }>;
  }) => Promise<void>;
  categories: WishlistCategoryRecord[];
  item: WishlistItemRecord | null;
  submitting?: boolean;
}

export function EditItemDialog(props: EditItemDialogProps) {
  const [title, setTitle] = createSignal("");
  const [description, setDescription] = createSignal("");
  const [categoryId, setCategoryId] = createSignal("");
  const [status, setStatus] = createSignal<WishlistItemStatus>("want");
  const [priority, setPriority] = createSignal<string>("");
  const linkManager = useLinkManager();
  const duplicateUrlCheck = useDuplicateUrlCheck({
    links: linkManager.links,
    updateLink: linkManager.updateLink,
    excludeItemId: () => props.item?.id,
  });

  // Reset form when dialog opens/closes or item changes
  createEffect(() => {
    if (props.open && props.item) {
      setTitle(props.item.title);
      setDescription(props.item.description || "");
      setCategoryId(props.item.category_id || "");
      setStatus(props.item.status ?? "want");
      setPriority(
        props.item.priority != null ? String(props.item.priority) : "",
      );
      duplicateUrlCheck.reset();

      // Convert existing links
      const existingLinks: LinkItem[] = (props.item.links || []).map(
        (link) => ({
          id: link.id,
          url: link.url,
          description: link.description || "",
          isPrimary: link.is_primary,
          isNew: false,
          isDeleted: false,
        }),
      );

      linkManager.resetLinks(existingLinks);
    } else if (!props.open) {
      // Reset form
      setTitle("");
      setDescription("");
      setCategoryId("");
      setStatus("want");
      setPriority("");
      duplicateUrlCheck.reset();
      linkManager.resetLinks([]);
    }
  });

  const handleSubmit = (e: Event) => {
    e.preventDefault();

    if (!props.item) return;

    const activeLinks = linkManager
      .links()
      .filter((link: LinkItem) => !link.isDeleted);

    const parsedPriority = priority() ? parseInt(priority(), 10) : undefined;

    props.onSubmit({
      id: props.item.id,
      title: title().trim(),
      description: description().trim() || undefined,
      category_id: categoryId().trim() || null,
      status: status(),
      priority:
        parsedPriority && parsedPriority >= 1 && parsedPriority <= 5
          ? parsedPriority
          : undefined,
      links: activeLinks.map((link: LinkItem) => ({
        id: link.id,
        url: link.url.trim(),
        description: link.description?.trim() || undefined,
        isPrimary: link.isPrimary,
        isNew: link.isNew,
        isDeleted: link.isDeleted,
      })),
    });
  };

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
                  <option value="">No category</option>
                  <For each={props.categories}>
                    {(category) => (
                      <option value={category.id}>{category.name}</option>
                    )}
                  </For>
                </Select>
              </div>

              {/* Status */}
              <fieldset class="space-y-2">
                <legend class="text-sm font-medium text-foreground">
                  Status
                </legend>
                <div class="flex gap-3">
                  <For
                    each={
                      ["want", "purchased", "archived"] as WishlistItemStatus[]
                    }
                  >
                    {(s) => (
                      <label class="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="radio"
                          name="status"
                          value={s}
                          checked={status() === s}
                          onChange={() => setStatus(s)}
                          class="accent-primary"
                        />
                        <span class="text-sm capitalize text-foreground">
                          {s}
                        </span>
                      </label>
                    )}
                  </For>
                </div>
              </fieldset>

              {/* Priority */}
              <div class="space-y-2">
                <label class="text-sm font-medium text-foreground">
                  Priority
                </label>
                <Select
                  value={priority()}
                  onChange={(e) => setPriority(e.currentTarget.value)}
                  class="w-full"
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
                emptySubMessage="You can add links now or later after updating the item"
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
