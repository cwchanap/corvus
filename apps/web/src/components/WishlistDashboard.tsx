import {
  createSignal,
  For,
  Show,
  createMemo,
  createEffect,
  on,
} from "solid-js";
import { A, useNavigate } from "@solidjs/router";
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
import type {
  WishlistCategoryRecord,
  WishlistItemRecord,
} from "@repo/common/types/wishlist-record";
import { useTheme } from "../lib/theme/context.jsx";
import { AddItemDialog } from "./AddItemDialog.jsx";
import { EditItemDialog } from "./EditItemDialog.jsx";
import { ViewItemDialog } from "./ViewItemDialog.jsx";
import { CategoryManager } from "./CategoryManager.jsx";
import {
  useWishlist,
  useDeleteItem,
  useCreateItem,
  useUpdateItem,
  useAddItemLink,
  useUpdateItemLink,
  useDeleteItemLink,
} from "../lib/graphql/hooks/use-wishlist.js";
import { useLogout } from "../lib/graphql/hooks/use-auth.js";
import { adaptWishlistData } from "../lib/graphql/adapters.js";

type WishlistCategory = WishlistCategoryRecord;
type WishlistItem = WishlistItemRecord;

interface WishlistDashboardProps {
  user: {
    id: string;
    name: string;
    email: string;
  };
}

// Sortable Item Component
function SortableWishlistItem(props: {
  item: WishlistItem;
  onDelete: (id: string) => void;
  onEdit: (item: WishlistItem) => void;
  onView: (item: WishlistItem) => void;
}) {
  const style = {} as const;
  const createdAtLabel = () => {
    const d = new Date(props.item.created_at as unknown as string);
    return isNaN(d.getTime()) ? "just now" : d.toLocaleDateString();
  };

  const itemLinksCount = () => props.item.links?.length ?? 0;

  return (
    <div style={style}>
      <Card class="transition-all duration-200 hover:shadow-lg shadow-md border-0 bg-card/80 backdrop-blur-sm">
        <CardContent class="p-6">
          <div class="flex items-start justify-between">
            <button
              type="button"
              onClick={() => props.onView(props.item)}
              class="flex-1 text-left bg-transparent border-0 p-0 outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg transition-colors"
            >
              <div class="flex flex-col gap-2">
                <div class="flex items-center gap-2">
                  <h3 class="font-semibold text-card-foreground text-lg hover:text-primary transition-colors">
                    {props.item.title}
                  </h3>
                </div>

                <Show when={props.item.description}>
                  <p class="text-sm text-muted-foreground leading-relaxed">
                    {props.item.description}
                  </p>
                </Show>

                <div class="text-xs text-muted-foreground flex items-center justify-between pt-2">
                  <div class="flex items-center">
                    <span class="w-2 h-2 bg-primary rounded-full mr-2" />
                    Added {createdAtLabel()}
                  </div>
                  <div class="text-xs">
                    {itemLinksCount()} link{itemLinksCount() !== 1 ? "s" : ""}
                  </div>
                </div>
              </div>
            </button>
            <div class="flex gap-2">
              <button
                onClick={() => props.onEdit(props.item)}
                class="text-muted-foreground hover:text-primary hover:bg-accent ml-2 p-2 rounded-lg transition-all duration-200"
                title="Edit item"
              >
                ✏️
              </button>
              <button
                onClick={() => props.onDelete(props.item.id)}
                class="text-destructive hover:text-destructive/80 hover:bg-destructive/10 p-2 rounded-lg transition-all duration-200 font-bold text-lg"
                title="Delete item"
              >
                ×
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function WishlistDashboard(props: WishlistDashboardProps) {
  const theme = useTheme();
  const PAGE_SIZE = 10;
  const [selectedCategory, setSelectedCategory] = createSignal<string | null>(
    null,
  );
  const [searchQuery, setSearchQuery] = createSignal("");
  const [sortBy, setSortBy] = createSignal<"date" | "title" | "custom">(
    "custom",
  );
  const [page, setPage] = createSignal(1);
  const [addOpen, setAddOpen] = createSignal(false);
  const [editOpen, setEditOpen] = createSignal(false);
  const [editingItem, setEditingItem] = createSignal<WishlistItem | null>(null);
  const [viewOpen, setViewOpen] = createSignal(false);
  const [viewingItem, setViewingItem] = createSignal<WishlistItem | null>(null);
  const [categoryManagerOpen, setCategoryManagerOpen] = createSignal(false);

  const navigate = useNavigate();
  const logoutMutation = useLogout();
  const deleteItemMutation = useDeleteItem();
  const createItemMutation = useCreateItem();
  const updateItemMutation = useUpdateItem();
  const addItemLinkMutation = useAddItemLink();
  const updateItemLinkMutation = useUpdateItemLink();
  const deleteItemLinkMutation = useDeleteItemLink();

  // Fetch wishlist data using GraphQL
  const wishlistQuery = useWishlist(
    () => ({
      categoryId: selectedCategory() ?? undefined,
      search: searchQuery().trim() || undefined,
    }),
    () => ({
      page: page(),
      pageSize: PAGE_SIZE,
    }),
  );

  // Adapt GraphQL data to component's expected format
  const wishlistData = createMemo(() => {
    if (!wishlistQuery.data) return undefined;
    return adaptWishlistData(wishlistQuery.data);
  });

  const items = createMemo(() => wishlistData()?.items ?? []);
  const pagination = createMemo(() => wishlistData()?.pagination ?? null);

  // Reset page when category or search changes
  // Use on() to explicitly track only the signals we care about
  createEffect(
    on(selectedCategory, () => {
      setPage(1);
    }),
  );

  createEffect(
    on(searchQuery, () => {
      setPage(1);
    }),
  );

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
      // Redirect to home after logout
      navigate("/");
    } catch (err) {
      console.error("Logout error:", err);
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
    try {
      // Create the item via GraphQL
      const newItem = await createItemMutation.mutateAsync({
        title: payload.title,
        categoryId: payload.category_id || undefined,
        description: payload.description,
      });

      // Add links to the item
      for (const link of payload.links) {
        await addItemLinkMutation.mutateAsync({
          itemId: newItem.id,
          input: {
            url: link.url,
            description: link.description,
            isPrimary: link.isPrimary || false,
          },
        });
      }

      if (page() !== 1) {
        setPage(1);
      }
      setAddOpen(false);
    } catch (error) {
      console.error("Failed to add item:", error);
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
    const query = searchQuery().trim().toLowerCase();
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
    try {
      await deleteItemMutation.mutateAsync(itemId);
      if (viewingItem()?.id === itemId) {
        setViewOpen(false);
        setViewingItem(null);
      }
      // TanStack Query automatically refetches
    } catch (err) {
      console.error("Error deleting item:", err);
    }
  };

  const totalItems = createMemo(() => pagination()?.total_items ?? 0);
  const currentPage = createMemo(() => pagination()?.page ?? 1);
  const totalPages = createMemo(() => pagination()?.total_pages ?? 0);
  const canGoPrevious = createMemo(() => pagination()?.has_previous ?? false);
  const canGoNext = createMemo(() => pagination()?.has_next ?? false);
  const pageSizeDisplay = createMemo(() =>
    pagination()?.page_size && pagination()!.page_size > 0
      ? pagination()!.page_size
      : PAGE_SIZE,
  );
  const displayPage = createMemo(() => Math.max(currentPage(), 1));
  const displayTotalPages = createMemo(() => {
    const total = totalPages();
    if (total > 0) return total;
    return currentPage() > 0 ? currentPage() : 1;
  });
  const pageRange = createMemo(() => {
    const meta = pagination();
    const currentItems = filteredAndSortedItems();

    if (!meta || meta.total_items === 0 || currentItems.length === 0) {
      return { start: 0, end: 0 };
    }

    const start = (meta.page - 1) * meta.page_size + 1;
    const end = Math.min(start + currentItems.length - 1, meta.total_items);
    return { start, end };
  });

  const openViewDialog = (item: WishlistItem) => {
    setViewingItem(item);
    setViewOpen(true);
  };

  const handleViewOpenChange = (open: boolean) => {
    setViewOpen(open);
    if (!open) {
      setViewingItem(null);
    }
  };

  const openEditDialog = (item: WishlistItem) => {
    if (viewingItem()?.id === item.id) {
      handleViewOpenChange(false);
    }
    setEditingItem(item);
    setEditOpen(true);
  };

  const handleEditSubmit = async (payload: {
    id: string;
    title: string;
    description?: string;
    category_id?: string | null;
    links: Array<{
      id?: string;
      url: string;
      description?: string;
      isPrimary?: boolean;
      isNew?: boolean;
      isDeleted?: boolean;
    }>;
  }) => {
    try {
      // Update the item via GraphQL
      await updateItemMutation.mutateAsync({
        id: payload.id,
        input: {
          title: payload.title,
          description: payload.description,
          categoryId: payload.category_id,
        },
      });

      // Handle link updates
      for (const link of payload.links) {
        if (link.isDeleted && link.id) {
          // Delete existing link
          await deleteItemLinkMutation.mutateAsync(link.id);
        } else if (link.isNew) {
          // Create new link
          await addItemLinkMutation.mutateAsync({
            itemId: payload.id,
            input: {
              url: link.url,
              description: link.description,
              isPrimary: link.isPrimary || false,
            },
          });
        } else if (link.id) {
          // Update existing link
          await updateItemLinkMutation.mutateAsync({
            id: link.id,
            input: {
              url: link.url,
              description: link.description,
              isPrimary: link.isPrimary || false,
            },
          });
        }
      }

      setEditOpen(false);
      setEditingItem(null);
    } catch (error) {
      console.error("Failed to update item:", error);
    }
  };

  createEffect(() => {
    const current = viewingItem();
    if (!current) return;

    const updated = items().find((item) => item.id === current.id);
    if (!updated) {
      handleViewOpenChange(false);
      return;
    }

    if (updated !== current) {
      setViewingItem(updated);
    }
  });

  const handleCategoryRefetch = async () => {
    await wishlistQuery.refetch();
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
        <Show when={wishlistQuery.isLoading}>
          <div class="text-center py-12">
            <div class="text-muted-foreground">Loading your wishlist...</div>
          </div>
        </Show>

        <Show when={wishlistQuery.isError}>
          <div class="text-center py-12">
            <div class="text-destructive">
              Error loading wishlist:{" "}
              {wishlistQuery.error?.message || "Unknown error"}
            </div>
          </div>
        </Show>

        <Show when={!wishlistQuery.isLoading && !wishlistQuery.isError}>
          <div class="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Categories Sidebar */}
            <div class="lg:col-span-1">
              <Card class="shadow-xl border-0 bg-card/80 backdrop-blur-sm">
                <CardHeader class="pb-4">
                  <div class="flex items-center justify-between">
                    <div>
                      <CardTitle class="text-xl text-card-foreground">
                        Categories
                      </CardTitle>
                      <CardDescription class="text-muted-foreground">
                        Organize your wishlist
                      </CardDescription>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setCategoryManagerOpen(true)}
                      title="Manage Categories"
                    >
                      ⚙️
                    </Button>
                  </div>
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
                      All Items ({totalItems()})
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
                      <SortableWishlistItem
                        item={item}
                        onDelete={deleteItem}
                        onEdit={openEditDialog}
                        onView={openViewDialog}
                      />
                    )}
                  </For>
                  <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
                    <div class="text-sm text-muted-foreground">
                      <Show
                        when={totalItems() > 0 && pageRange().start > 0}
                        fallback={<span>No items to display</span>}
                      >
                        {`Showing ${pageRange().start}–${pageRange().end} of ${totalItems()} items`}
                      </Show>
                    </div>
                    <div class="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (canGoPrevious()) {
                            setPage(Math.max(1, currentPage() - 1));
                          }
                        }}
                        disabled={!canGoPrevious()}
                      >
                        Previous
                      </Button>
                      <span class="text-sm font-medium text-muted-foreground">
                        Page {displayPage()} of {displayTotalPages()}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (canGoNext()) {
                            setPage(currentPage() + 1);
                          }
                        }}
                        disabled={!canGoNext()}
                      >
                        Next
                      </Button>
                      <span class="text-xs text-muted-foreground">
                        {pageSizeDisplay()} per page
                      </span>
                    </div>
                  </div>
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
        submitting={createItemMutation.isPending}
      />
      <EditItemDialog
        open={editOpen()}
        onOpenChange={setEditOpen}
        onSubmit={handleEditSubmit}
        categories={wishlistData()?.categories || []}
        item={editingItem()}
        submitting={updateItemMutation.isPending}
      />
      <ViewItemDialog
        open={viewOpen()}
        onOpenChange={handleViewOpenChange}
        categories={wishlistData()?.categories || []}
        item={viewingItem()}
      />
      <Show when={categoryManagerOpen()}>
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            class="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setCategoryManagerOpen(false)}
          />
          <div class="relative z-50 w-full max-w-2xl">
            <CategoryManager
              categories={wishlistData()?.categories || []}
              onRefetch={handleCategoryRefetch}
              onClose={() => setCategoryManagerOpen(false)}
            />
          </div>
        </div>
      </Show>
    </div>
  );
}
