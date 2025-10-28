import { Accessor, Setter } from "solid-js";
import { Button } from "@repo/ui-components/button";
import { Input } from "@repo/ui-components/input";
import { Select } from "@repo/ui-components/select";

interface WishlistFiltersProps {
  categoryName: string;
  searchQuery: Accessor<string>;
  setSearchQuery: Setter<string>;
  sortBy: Accessor<"date" | "title" | "custom">;
  setSortBy: Setter<"date" | "title" | "custom">;
  onAddItem: () => void;
}

export function WishlistFilters(props: WishlistFiltersProps) {
  return (
    <div class="mb-8 space-y-6">
      <div class="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <h2 class="text-2xl font-bold text-foreground">{props.categoryName}</h2>
        <Button
          onClick={props.onAddItem}
          class="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 dark:from-purple-500 dark:to-pink-500 dark:hover:from-purple-600 dark:hover:to-pink-600 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
        >
          Add Item
        </Button>
      </div>

      <div class="flex flex-col sm:flex-row gap-4">
        <div class="flex-1">
          <Input
            type="text"
            placeholder="Search items..."
            value={props.searchQuery()}
            onInput={(e) => props.setSearchQuery(e.currentTarget.value)}
            class="w-full"
          />
        </div>
        <div class="sm:w-48">
          <Select
            value={props.sortBy()}
            onChange={(e) =>
              props.setSortBy(
                e.currentTarget.value as "date" | "title" | "custom",
              )
            }
          >
            <option value="custom">Custom Order</option>
            <option value="date">Sort by Date</option>
            <option value="title">Sort by Title</option>
          </Select>
        </div>
      </div>
    </div>
  );
}
