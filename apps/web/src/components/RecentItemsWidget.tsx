import { For, Show } from "solid-js";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@repo/ui-components/card";
import type {
  WishlistCategoryRecord,
  WishlistItemRecord,
} from "@repo/common/types/wishlist-record";
import { useRecentItems } from "../lib/graphql/hooks/use-wishlist";
import { adaptItem } from "../lib/graphql/adapters";
import { formatRelativeTime } from "@repo/common/utils/format-relative-time";

interface RecentItemsWidgetProps {
  categories: WishlistCategoryRecord[];
  onViewItem: (item: WishlistItemRecord) => void;
}

export function RecentItemsWidget(props: RecentItemsWidgetProps) {
  const recentQuery = useRecentItems();

  const recentItems = () => {
    const data = recentQuery.data;
    if (!data || data.length === 0) return [];
    return data.map(adaptItem);
  };

  const getCategoryName = (categoryId: string | undefined) => {
    if (!categoryId) return "Uncategorized";
    return (
      props.categories.find((c) => c.id === categoryId)?.name ?? "Uncategorized"
    );
  };

  return (
    <Show when={recentItems().length > 0}>
      <Card class="shadow-xl border-0 bg-card/80 backdrop-blur-sm mb-6">
        <CardHeader class="pb-3">
          <CardTitle class="text-base text-card-foreground">
            Recently Added
          </CardTitle>
        </CardHeader>
        <CardContent class="px-6 pb-4">
          <div class="space-y-2">
            <For each={recentItems()}>
              {(item) => (
                <button
                  type="button"
                  onClick={() => props.onViewItem(item)}
                  class="w-full text-left flex items-center justify-between gap-3 px-3 py-2 rounded-lg hover:bg-accent transition-colors duration-150 group"
                >
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                      {item.title}
                    </p>
                    <p class="text-xs text-muted-foreground truncate">
                      {getCategoryName(item.category_id)}
                    </p>
                  </div>
                  <span
                    class="text-xs text-muted-foreground whitespace-nowrap flex-shrink-0"
                    title={new Date(item.created_at).toLocaleString()}
                  >
                    {formatRelativeTime(item.created_at)}
                  </span>
                </button>
              )}
            </For>
          </div>
        </CardContent>
      </Card>
    </Show>
  );
}
