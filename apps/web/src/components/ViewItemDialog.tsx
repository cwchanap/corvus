import { Show, For } from "solid-js";
import { Button } from "@repo/ui-components/button";
import type {
  WishlistCategoryRecord,
  WishlistItemRecord,
} from "@repo/common/types/wishlist-record";

interface ViewItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: WishlistItemRecord | null;
  categories: WishlistCategoryRecord[];
}

export function ViewItemDialog(props: ViewItemDialogProps) {
  const categoryName = () => {
    const category = props.categories.find(
      (cat) => cat.id === props.item?.category_id,
    );
    return category?.name ?? "Uncategorized";
  };

  return (
    <Show when={props.open && props.item}>
      <div class="fixed inset-0 bg-foreground/40 flex items-center justify-center z-50 p-4">
        <div class="rounded-sm border border-border bg-card text-card-foreground max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div class="p-6 space-y-6">
            <div class="flex items-start justify-between">
              <div>
                <h2 class="text-xl font-display text-card-foreground">
                  {props.item?.title}
                </h2>
                <p class="font-mono text-xs uppercase tracking-wide text-muted-foreground mt-1">
                  Added {new Date(props.item!.created_at).toLocaleString()}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => props.onOpenChange(false)}
                aria-label="Close dialog"
                class="text-muted-foreground hover:text-foreground shrink-0"
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
            </div>

            <div class="space-y-4 divide-y divide-border">
              <div class="pt-0">
                <span class="font-mono text-xs uppercase tracking-wide text-muted-foreground">
                  Category
                </span>
                <p class="font-serif text-sm text-foreground mt-1">
                  {categoryName()}
                </p>
              </div>

              <Show when={props.item?.description}>
                <div class="pt-4">
                  <span class="font-mono text-xs uppercase tracking-wide text-muted-foreground">
                    Notes
                  </span>
                  <p class="font-serif text-sm text-foreground whitespace-pre-wrap mt-1 leading-relaxed">
                    {props.item?.description}
                  </p>
                </div>
              </Show>

              <div class="pt-4">
                <span class="font-mono text-xs uppercase tracking-wide text-muted-foreground">
                  Links
                </span>
                <Show
                  when={props.item?.links && props.item.links.length > 0}
                  fallback={
                    <p class="font-serif text-sm text-muted-foreground mt-1">
                      No links saved for this item yet.
                    </p>
                  }
                >
                  <ul class="mt-2 divide-y divide-border">
                    <For each={props.item?.links}>
                      {(link) => (
                        <li class="flex items-center justify-between py-2">
                          <a
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            class="font-serif text-sm text-primary hover:text-primary/80 break-all transition-colors duration-200 flex items-center gap-1.5"
                          >
                            {link.description || link.url}
                            <svg
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              stroke-width="1.5"
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              aria-hidden="true"
                              class="h-3 w-3 shrink-0"
                            >
                              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14 21 3" />
                            </svg>
                          </a>
                          <Show when={link.is_primary}>
                            <span class="ml-2 font-mono text-[10px] uppercase tracking-wide text-muted-foreground border border-border rounded-sm px-2 py-0.5 shrink-0">
                              Primary
                            </span>
                          </Show>
                        </li>
                      )}
                    </For>
                  </ul>
                </Show>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Show>
  );
}
