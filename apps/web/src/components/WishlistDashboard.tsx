import { createSignal, createResource, For, Show, createMemo } from "solid-js";
import { A } from "@solidjs/router";
import { Button } from "@repo/ui-components/button";
import { Input } from "@repo/ui-components/input";
import { Select } from "@repo/ui-components/select";
import { ThemeToggle } from "@repo/ui-components/theme-toggle";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui-components/card";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { WishlistCategory, WishlistItem } from "../lib/db/types";
import { useTheme } from "../lib/theme/context";

interface WishlistDashboardProps {
  user: {
    id: number;
    name: string;
    email: string;
  };
}

// Sortable Item Component
function SortableWishlistItem(props: {
  item: WishlistItem;
  onDelete: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: props.item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <Card class={`transition-all ${isDragging ? "shadow-lg" : ""}`}>
        <CardContent class="p-4">
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <div class="flex items-center gap-2 mb-1">
                <button
                  {...listeners}
                  class="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground p-1"
                  title="Drag to reorder"
                >
                  ⋮⋮
                </button>
                <h3 class="font-medium text-foreground">{props.item.title}</h3>
              </div>
              <a
                href={props.item.url}
                target="_blank"
                rel="noopener noreferrer"
                class="text-sm text-primary hover:text-primary/80 break-all block ml-6"
              >
                {props.item.url}
              </a>
              <Show when={props.item.description}>
                <p class="text-sm text-muted-foreground mt-2 ml-6">
                  {props.item.description}
                </p>
              </Show>
              <div class="text-xs text-muted-foreground mt-2 ml-6">
                Added {new Date(props.item.created_at).toLocaleDateString()}
              </div>
            </div>
            <button
              onClick={() => props.onDelete(props.item.id)}
              class="text-destructive hover:text-destructive/80 ml-2 p-1"
              title="Delete item"
            >
              ×
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function WishlistDashboard(props: WishlistDashboardProps) {
  const theme = useTheme();
  const [selectedCategory, setSelectedCategory] = createSignal<string | null>(
    null,
  );
  const [searchQuery, setSearchQuery] = createSignal("");
  const [sortBy, setSortBy] = createSignal<"date" | "title" | "custom">(
    "custom",
  );
  const [items, setItems] = createSignal<WishlistItem[]>([]);

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // Fetch wishlist data
  const [wishlistData] = createResource(async () => {
    const response = await fetch("/api/wishlist");

    if (!response.ok) {
      throw new Error("Failed to fetch wishlist data");
    }

    const data = await response.json();
    setItems(data.items || []);
    return data;
  });

  // Enhanced filtering and sorting
  const filteredAndSortedItems = createMemo(() => {
    let result = items();

    // Filter by category
    if (selectedCategory()) {
      result = result.filter((item) => item.category_id === selectedCategory());
    }

    // Filter by search query
    const query = searchQuery().toLowerCase();
    if (query) {
      result = result.filter(
        (item) =>
          item.title.toLowerCase().includes(query) ||
          item.description?.toLowerCase().includes(query) ||
          item.url.toLowerCase().includes(query),
      );
    }

    // Sort items
    const sort = sortBy();
    if (sort === "date") {
      result = [...result].sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
    } else if (sort === "title") {
      result = [...result].sort((a, b) => a.title.localeCompare(b.title));
    }
    // "custom" maintains the current order for drag-and-drop

    return result;
  });

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = items().findIndex((item) => item.id === active.id);
      const newIndex = items().findIndex((item) => item.id === over.id);

      const newItems = arrayMove(items(), oldIndex, newIndex);
      setItems(newItems);

      // TODO: Update order in backend
      // updateItemOrder(newItems.map(item => item.id));
    }
  };

  const addItem = async (title: string, url: string, description?: string) => {
    const categoryId = selectedCategory() || wishlistData()?.categories[0]?.id;

    if (!categoryId) return;

    const response = await fetch("/api/wishlist/items", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title,
        url,
        description,
        category_id: categoryId,
      }),
    });

    if (response.ok) {
      wishlistData.refetch();
    }
  };

  const deleteItem = async (itemId: string) => {
    const response = await fetch(`/api/wishlist/items/${itemId}`, {
      method: "DELETE",
    });

    if (response.ok) {
      // Update local state immediately
      setItems((prev) => prev.filter((item) => item.id !== itemId));
      wishlistData.refetch();
    }
  };

  return (
    <div class="min-h-screen bg-background">
      {/* Header */}
      <header class="bg-card shadow-sm border-b border-border">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex justify-between items-center py-4">
            <div>
              <h1 class="text-2xl font-bold text-foreground">
                Corvus Wishlist
              </h1>
              <p class="text-sm text-muted-foreground">
                Welcome back, {props.user.name}!
              </p>
            </div>
            <div class="flex items-center gap-2">
              <ThemeToggle
                theme={theme.theme}
                setTheme={theme.setTheme}
                resolvedTheme={theme.resolvedTheme}
              />
              <A href="/api/auth/logout">
                <Button variant="outline">Sign Out</Button>
              </A>
            </div>
          </div>
        </div>
      </header>

      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Show when={wishlistData.loading}>
          <div class="text-center py-12">
            <div class="text-muted-foreground">Loading your wishlist...</div>
          </div>
        </Show>

        <Show when={wishlistData.error}>
          <div class="text-center py-12">
            <div class="text-destructive">
              Error loading wishlist: {wishlistData.error.message}
            </div>
          </div>
        </Show>

        <Show when={wishlistData()}>
          <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Categories Sidebar */}
            <div class="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>Categories</CardTitle>
                  <CardDescription>Organize your wishlist</CardDescription>
                </CardHeader>
                <CardContent>
                  <div class="space-y-2">
                    <button
                      onClick={() => setSelectedCategory(null)}
                      class={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        selectedCategory() === null
                          ? "bg-primary text-primary-foreground"
                          : "text-foreground hover:bg-accent"
                      }`}
                    >
                      All Items ({items().length || 0})
                    </button>
                    <For each={wishlistData()?.categories || []}>
                      {(category: WishlistCategory) => (
                        <button
                          onClick={() => setSelectedCategory(category.id)}
                          class={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                            selectedCategory() === category.id
                              ? "bg-primary text-primary-foreground"
                              : "text-foreground hover:bg-accent"
                          }`}
                        >
                          <div class="flex items-center space-x-2">
                            <div
                              class="w-3 h-3 rounded-full"
                              style={{
                                "background-color": category.color || "#6366f1",
                              }}
                            />
                            <span>{category.name}</span>
                            <span class="text-xs text-muted-foreground">
                              (
                              {items().filter(
                                (item: WishlistItem) =>
                                  item.category_id === category.id,
                              ).length || 0}
                              )
                            </span>
                          </div>
                        </button>
                      )}
                    </For>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Items Grid */}
            <div class="lg:col-span-3">
              {/* Search and Filter Controls */}
              <div class="mb-6 space-y-4">
                <div class="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                  <h2 class="text-xl font-semibold text-foreground">
                    {selectedCategory()
                      ? wishlistData()?.categories?.find(
                          (c: WishlistCategory) => c.id === selectedCategory(),
                        )?.name
                      : "All Items"}
                  </h2>
                  <Button
                    onClick={() => {
                      const title = prompt("Item title:");
                      const url = prompt("Item URL:");
                      if (title && url) {
                        addItem(title, url);
                      }
                    }}
                  >
                    Add Item
                  </Button>
                </div>

                <div class="flex flex-col sm:flex-row gap-4">
                  <div class="flex-1">
                    <Input
                      type="text"
                      placeholder="Search items..."
                      value={searchQuery()}
                      onInput={(e) => setSearchQuery(e.currentTarget.value)}
                      class="w-full"
                    />
                  </div>
                  <div class="sm:w-48">
                    <Select
                      value={sortBy()}
                      onChange={(e) =>
                        setSortBy(
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

              <Show when={filteredAndSortedItems().length === 0}>
                <Card>
                  <CardContent class="text-center py-12">
                    <div class="text-muted-foreground">
                      {searchQuery()
                        ? `No items found matching "${searchQuery()}"`
                        : "No items in this category yet. Add your first item!"}
                    </div>
                  </CardContent>
                </Card>
              </Show>

              <Show when={filteredAndSortedItems().length > 0}>
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={filteredAndSortedItems().map((item) => item.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div class="space-y-4">
                      <For each={filteredAndSortedItems()}>
                        {(item: WishlistItem) => (
                          <SortableWishlistItem
                            item={item}
                            onDelete={deleteItem}
                          />
                        )}
                      </For>
                    </div>
                  </SortableContext>
                </DndContext>
              </Show>
            </div>
          </div>
        </Show>
      </div>
    </div>
  );
}
