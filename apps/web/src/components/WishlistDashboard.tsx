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
import type { WishlistCategory, WishlistItem } from "../lib/db/types.js";
import { useTheme } from "../lib/theme/context.jsx";
import { AddItemDialog } from "./AddItemDialog.jsx";

type WishlistData = {
  categories: WishlistCategory[];
  items: WishlistItem[];
};

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
  const [expandedLinks, setExpandedLinks] = createSignal(false);

  const style = {} as const;
  const createdAtLabel = () => {
    const d = new Date(props.item.created_at as unknown as string);
    return isNaN(d.getTime()) ? "just now" : d.toLocaleDateString();
  };

  // Mock links data - in real implementation, this would come from the item
  const mockLinks = () => [
    {
      id: "1",
      url: "https://example.com",
      description: "Main product page",
      isPrimary: true,
    },
    {
      id: "2",
      url: "https://example.com/reviews",
      description: "Reviews",
      isPrimary: false,
    },
  ];

  const primaryLink = () =>
    mockLinks().find((link) => link.isPrimary) || mockLinks()[0];
  const secondaryLinks = () => mockLinks().filter((link) => !link.isPrimary);

  return (
    <div style={style}>
      <Card class="transition-all duration-200 hover:shadow-lg shadow-md border-0 bg-card/80 backdrop-blur-sm">
        <CardContent class="p-6">
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <div class="flex items-center gap-2 mb-2">
                <h3 class="font-semibold text-card-foreground text-lg">
                  {props.item.title}
                </h3>
              </div>

              {/* Primary Link */}
              <Show when={primaryLink()}>
                {(link) => (
                  <a
                    href={link().url}
                    target="_blank"
                    rel="noopener noreferrer"
                    class="text-sm text-primary hover:text-primary/80 break-all block transition-colors duration-200 font-medium"
                  >
                    {link().description || link().url}
                  </a>
                )}
              </Show>

              {/* Secondary Links Toggle */}
              <Show when={secondaryLinks().length > 0}>
                <button
                  onClick={() => setExpandedLinks(!expandedLinks())}
                  class="text-xs text-muted-foreground mt-1 hover:text-foreground transition-colors"
                >
                  {expandedLinks() ? "Hide" : "Show"} {secondaryLinks().length}{" "}
                  more link{secondaryLinks().length !== 1 ? "s" : ""}
                </button>
              </Show>

              {/* Expandable Secondary Links */}
              <Show when={expandedLinks() && secondaryLinks().length > 0}>
                <div class="mt-2 pl-4 border-l-2 border-muted space-y-1">
                  <For each={secondaryLinks()}>
                    {(link) => (
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        class="text-sm text-muted-foreground hover:text-primary break-all block transition-colors duration-200"
                      >
                        {link.description || link.url}
                      </a>
                    )}
                  </For>
                </div>
              </Show>

              <Show when={props.item.description}>
                <p class="text-sm text-muted-foreground mt-3 leading-relaxed">
                  {props.item.description}
                </p>
              </Show>
              <div class="text-xs text-muted-foreground mt-3 flex items-center justify-between">
                <div class="flex items-center">
                  <span class="w-2 h-2 bg-primary rounded-full mr-2" />
                  Added {createdAtLabel()}
                </div>
                <div class="text-xs">
                  {mockLinks().length} link{mockLinks().length !== 1 ? "s" : ""}
                </div>
              </div>
            </div>
            <button
              onClick={() => props.onDelete(props.item.id)}
              class="text-destructive hover:text-destructive/80 hover:bg-destructive/10 ml-4 p-2 rounded-lg transition-all duration-200 font-bold text-lg"
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
  const [addOpen, setAddOpen] = createSignal(false);
  const [adding, setAdding] = createSignal(false);

  // Fetch wishlist data
  const [wishlistData, { refetch }] = createResource<WishlistData>(async () => {
    if (typeof window === "undefined") {
      // Avoid relative fetch on server
      return { categories: [], items: [] } as WishlistData;
    }

    const response = await fetch(`/api/wishlist`);

    if (!response.ok) {
      throw new Error("Failed to fetch wishlist data");
    }

    const data = (await response.json()) as WishlistData;
    setItems(data.items || []);
    return data;
  });

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "GET",
        credentials: "include",
      });
    } catch {
      // ignore
    } finally {
      // Force full reload to refresh server-authenticated state
      window.location.href = "/login";
    }
  };

  const handleAddSubmit = async (payload: {
    title: string;
    description?: string;
    category_id?: string;
    links: Array<{
      url: string;
      description?: string;
      isPrimary?: boolean;
    }>;
  }) => {
    setAdding(true);
    try {
      // Create the item
      const response = await fetch("/api/wishlist/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title: payload.title,
          description: payload.description,
          category_id: payload.category_id,
        }),
      });

      if (!response.ok) throw new Error("Failed to create item");

      const newItem = (await response.json()) as WishlistItem;

      // Add links to the item
      for (const link of payload.links) {
        await fetch(`/api/wishlist/items/${newItem.id}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            url: link.url,
            description: link.description,
            is_primary: link.isPrimary || false,
          }),
        });
      }

      await refetch();
      setAddOpen(false);
    } catch (error) {
      console.error("Failed to add item:", error);
    } finally {
      setAdding(false);
    }
  };

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
          item.description?.toLowerCase().includes(query),
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

  const deleteItem = async (itemId: string) => {
    const response = await fetch(`/api/wishlist/items/${itemId}`, {
      method: "DELETE",
    });

    if (response.ok) {
      // Update local state immediately
      setItems((prev) => prev.filter((item) => item.id !== itemId));
      refetch();
    }
  };

  return (
    <div class="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900">
      {/* Header */}
      <header class="bg-card/80 backdrop-blur-sm shadow-lg border-b border-border">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex justify-between items-center py-6">
            <div>
              <h1 class="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Corvus Wishlist
              </h1>
              <p class="text-sm text-muted-foreground mt-1">
                Welcome back, {props.user.name}!
              </p>
            </div>
            <div class="flex items-center gap-3">
              <ThemeToggle
                theme={theme.theme}
                setTheme={theme.setTheme}
                resolvedTheme={theme.resolvedTheme}
              />
              <A href="/profile">
                <Button
                  variant="ghost"
                  class="text-foreground hover:text-primary hover:bg-accent transition-colors duration-200"
                >
                  Profile
                </Button>
              </A>
              <Button
                variant="outline"
                onClick={handleLogout}
                class="border-border text-foreground hover:bg-accent transition-colors duration-200"
              >
                Sign Out
              </Button>
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
          <div class="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Categories Sidebar */}
            <div class="lg:col-span-1">
              <Card class="shadow-xl border-0 bg-card/80 backdrop-blur-sm">
                <CardHeader class="pb-4">
                  <CardTitle class="text-xl text-card-foreground">
                    Categories
                  </CardTitle>
                  <CardDescription class="text-muted-foreground">
                    Organize your wishlist
                  </CardDescription>
                </CardHeader>
                <CardContent class="px-6 pb-6">
                  <div class="space-y-2">
                    <button
                      onClick={() => setSelectedCategory(null)}
                      class={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                        selectedCategory() === null
                          ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg"
                          : "text-foreground hover:bg-accent hover:text-accent-foreground"
                      }`}
                    >
                      All Items ({items().length || 0})
                    </button>
                    <For each={wishlistData()?.categories || []}>
                      {(category: WishlistCategory) => (
                        <button
                          onClick={() => setSelectedCategory(category.id)}
                          class={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                            selectedCategory() === category.id
                              ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg"
                              : "text-foreground hover:bg-accent hover:text-accent-foreground"
                          }`}
                        >
                          <div class="flex items-center space-x-3">
                            <div
                              class="w-3 h-3 rounded-full"
                              style={{
                                "background-color": category.color || "#6366f1",
                              }}
                            />
                            <span class="flex-1">{category.name}</span>
                            <span
                              class={`text-xs ${
                                selectedCategory() === category.id
                                  ? "text-white/70"
                                  : "text-muted-foreground"
                              }`}
                            >
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
              <div class="mb-8 space-y-6">
                <div class="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                  <h2 class="text-2xl font-bold text-foreground">
                    {selectedCategory()
                      ? wishlistData()?.categories?.find(
                          (c: WishlistCategory) => c.id === selectedCategory(),
                        )?.name
                      : "All Items"}
                  </h2>
                  <Button
                    onClick={() => {
                      setAddOpen(true);
                    }}
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
                <Card class="shadow-xl border-0 bg-card/80 backdrop-blur-sm">
                  <CardContent class="text-center py-16">
                    <div class="text-muted-foreground text-lg">
                      {searchQuery()
                        ? `No items found matching "${searchQuery()}"`
                        : "No items in this category yet. Add your first item!"}
                    </div>
                  </CardContent>
                </Card>
              </Show>

              <Show when={filteredAndSortedItems().length > 0}>
                <div class="space-y-4">
                  <For each={filteredAndSortedItems()}>
                    {(item: WishlistItem) => (
                      <SortableWishlistItem item={item} onDelete={deleteItem} />
                    )}
                  </For>
                </div>
              </Show>
            </div>
          </div>
        </Show>
      </div>
      <AddItemDialog
        open={addOpen()}
        onOpenChange={setAddOpen}
        onSubmit={handleAddSubmit}
        categories={wishlistData()?.categories || []}
        initialCategoryId={selectedCategory()}
        submitting={adding()}
      />
    </div>
  );
}
