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
      <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div class="bg-card rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div class="p-6 space-y-6">
            <div class="flex items-center justify-between">
              <div>
                <h2 class="text-xl font-semibold text-card-foreground">
                  {props.item?.title}
                </h2>
                <p class="text-xs text-muted-foreground mt-1">
                  Added {new Date(props.item!.created_at).toLocaleString()}
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

            <div class="space-y-4">
              <div>
                <span class="text-xs uppercase tracking-wide text-muted-foreground">
                  Category
                </span>
                <p class="text-sm text-foreground mt-1">{categoryName()}</p>
              </div>

              <Show when={props.item?.description}>
                <div>
                  <span class="text-xs uppercase tracking-wide text-muted-foreground">
                    Notes
                  </span>
                  <p class="text-sm text-foreground whitespace-pre-wrap mt-1 leading-relaxed">
                    {props.item?.description}
                  </p>
                </div>
              </Show>

              <div>
                <span class="text-xs uppercase tracking-wide text-muted-foreground">
                  Links
                </span>
                <Show
                  when={props.item?.links && props.item.links.length > 0}
                  fallback={
                    <p class="text-sm text-muted-foreground mt-1">
                      No links saved for this item yet.
                    </p>
                  }
                >
                  <ul class="mt-2 space-y-2">
                    <For each={props.item?.links}>
                      {(link) => (
                        <li>
                          <a
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            class="text-sm text-primary hover:text-primary/80 break-all transition-colors duration-200"
                          >
                            {link.description || link.url}
                          </a>
                          <Show when={link.is_primary}>
                            <span class="ml-2 text-[10px] uppercase tracking-wide text-muted-foreground border border-muted-foreground/30 rounded-full px-2 py-0.5">
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
