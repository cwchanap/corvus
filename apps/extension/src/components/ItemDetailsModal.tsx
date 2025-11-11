import { For, Show } from "solid-js";
import { Button } from "@repo/ui-components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@repo/ui-components/card";
import type { WishlistCategory, WishlistItem } from "../types/wishlist.ts";

interface ItemDetailsModalProps {
  item: WishlistItem | undefined;
  category: WishlistCategory | undefined;
  onClose: () => void;
  onOpenLink: (url: string) => void;
}

export function ItemDetailsModal(props: ItemDetailsModalProps) {
  return (
    <Show when={props.item}>
      <div
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
        onClick={() => props.onClose()}
      >
        <div
          class="w-full max-w-md"
          onClick={(event) => event.stopPropagation()}
        >
          <Card>
            <CardHeader class="flex items-start justify-between">
              <div>
                <CardTitle class="text-base">{props.item?.title}</CardTitle>
                <p class="text-xs text-muted-foreground mt-1">
                  Added{" "}
                  {props.item &&
                    new Date(props.item.createdAt).toLocaleString()}
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => props.onClose()}>
                ×
              </Button>
            </CardHeader>
            <CardContent class="space-y-4">
              <div>
                <span class="text-xs uppercase tracking-wide text-muted-foreground">
                  Category
                </span>
                <p class="text-sm mt-1">
                  {props.category?.name ?? "Uncategorized"}
                </p>
              </div>

              <Show when={props.item?.description}>
                <div>
                  <span class="text-xs uppercase tracking-wide text-muted-foreground">
                    Notes
                  </span>
                  <p class="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">
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
                  <div class="mt-2 space-y-2">
                    <For each={props.item?.links}>
                      {(link) => (
                        <Button
                          type="button"
                          variant="link"
                          size="sm"
                          class="h-auto justify-start p-0 text-left font-normal text-sm break-all"
                          onClick={() => props.onOpenLink(link.url)}
                          title={link.url}
                        >
                          {link.description || link.url}
                        </Button>
                      )}
                    </For>
                  </div>
                </Show>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Show>
  );
}
