import {
  createSignal,
  For,
  Show,
  createMemo,
  createEffect,
  on,
} from "solid-js";
import type { Accessor } from "solid-js";
import { A, useNavigate } from "@solidjs/router";
import { Button } from "@repo/ui-components/button";
import { ThemeToggle } from "@repo/ui-components/theme-toggle";
import { PaperBackground } from "@repo/ui-components/paper-background";
import { FeatherMark } from "@repo/ui-components/corvus-mark";
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
  WishlistItemStatus,
} from "@repo/common/types/wishlist-record";
import { useTheme } from "../lib/theme/context";
import { AddItemDialog } from "./AddItemDialog";
import { EditItemDialog } from "./EditItemDialog";
import { ViewItemDialog } from "./ViewItemDialog";
import { WishlistFilters } from "./WishlistFilters";
import type { StatusFilter, SortByOption } from "./WishlistFilters";
import { CategoryManager } from "./CategoryManager";
import { RecentItemsWidget } from "./RecentItemsWidget";
import {
  useWishlist,
  useDeleteItem,
  useCreateItem,
  useUpdateItem,
  useAddItemLink,
  useUpdateItemLink,
  useDeleteItemLink,
  useBatchDeleteItems,
  useBatchMoveItems,
  useItem,
} from "../lib/graphql/hooks/use-wishlist";
import { useLogout } from "../lib/graphql/hooks/use-auth";
import { adaptItem, adaptWishlistData } from "../lib/graphql/adapters";
import { useSelectionManager } from "../hooks/useSelectionManager";
import { BulkActionBar } from "./BulkActionBar";

type WishlistCategory = WishlistCategoryRecord;
type WishlistItem = WishlistItemRecord;
type WishlistQueryResult = ReturnType<typeof useWishlist>;

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
  isSelectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (id: string) => void;
}) {
  const createdAtLabel = () => {
    const d = new Date(props.item.created_at as unknown as string);
    return isNaN(d.getTime()) ? "just now" : d.toLocaleDateString();
  };

  const itemLinksCount = () => props.item.links?.length ?? 0;

  const handleClick = () => {
    if (props.isSelectionMode && props.onToggleSelect) {
      props.onToggleSelect(props.item.id);
    } else {
      props.onView(props.item);
    }
  };

  const handleCheckboxChange = (e: Event) => {
    e.stopPropagation();
    if (props.onToggleSelect) {
      props.onToggleSelect(props.item.id);
    }
  };

  return (
    <div
      class={`group relative border-b border-border py-5 transition-colors ${
        props.isSelected ? "bg-primary/5" : "hover:bg-accent/40"
      }`}
    >
      <div class="flex items-start justify-between gap-4">
        <button
          type="button"
          onClick={handleClick}
          class="flex-1 rounded-sm border-0 bg-transparent p-0 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <div class="flex items-start gap-3">
            <Show when={props.isSelectionMode}>
              <input
                type="checkbox"
                checked={props.isSelected}
                onChange={handleCheckboxChange}
                onClick={(e) => e.stopPropagation()}
                aria-label={`Select ${props.item.title}`}
                class="mt-1.5 h-4 w-4 flex-shrink-0 cursor-pointer rounded-none border border-input accent-[hsl(var(--primary))]"
              />
            </Show>

            <div class="flex flex-1 flex-col gap-1.5">
              <div class="flex flex-wrap items-center gap-2">
                <h3 class="font-serif text-lg font-medium text-foreground transition-colors group-hover:text-primary">
                  {props.item.title}
                </h3>
                <Show when={props.item.status && props.item.status !== "want"}>
                  <span
                    class={`rounded-sm border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider ${
                      props.item.status === "purchased"
                        ? "border-primary/30 bg-primary/10 text-primary"
                        : "border-border bg-secondary text-muted-foreground"
                    }`}
                  >
                    {props.item.status}
                  </span>
                </Show>
                <Show when={props.item.priority != null}>
                  <span class="rounded-sm border border-border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    P{props.item.priority}
                  </span>
                </Show>
              </div>

              <Show when={props.item.description}>
                <p class="font-serif text-sm leading-relaxed text-muted-foreground">
                  {props.item.description}
                </p>
              </Show>

              <div class="pt-1 font-mono text-xs text-muted-foreground">
                Added {createdAtLabel()} · {itemLinksCount()} link
                {itemLinksCount() !== 1 ? "s" : ""}
              </div>
            </div>
          </div>
        </button>

        <Show when={!props.isSelectionMode}>
          <div class="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
            <button
              onClick={() => props.onEdit(props.item)}
              class="rounded-sm p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-primary"
              title="Edit item"
              aria-label={`Edit ${props.item.title}`}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
              </svg>
            </button>
            <button
              onClick={() => props.onDelete(props.item.id)}
              class="rounded-sm p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
              title="Delete item"
              aria-label={`Delete ${props.item.title}`}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                <path d="M3 6h18" />
                <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                <path d="M10 11v6M14 11v6" />
              </svg>
            </button>
          </div>
        </Show>
      </div>
    </div>
  );
}

interface WishlistItemsSectionProps {
  wishlistQuery: WishlistQueryResult;
  filteredItems: Accessor<WishlistItem[]>;
  searchQuery: Accessor<string>;
  totalItems: Accessor<number>;
  pageRange: Accessor<{ start: number; end: number }>;
  displayPage: Accessor<number>;
  displayTotalPages: Accessor<number>;
  pageSizeDisplay: Accessor<number>;
  canGoPrevious: Accessor<boolean>;
  canGoNext: Accessor<boolean>;
  onPrevious: () => void;
  onNext: () => void;
  onDelete: (id: string) => Promise<void> | void;
  onEdit: (item: WishlistItem) => void;
  onView: (item: WishlistItem) => void;
  isSelectionMode?: boolean;
  isSelected?: (id: string) => boolean;
  onToggleSelect?: (id: string) => void;
}

function WishlistItemsSection(props: WishlistItemsSectionProps) {
  const hasItems = () => props.filteredItems().length > 0;

  return (
    <div class="lg:col-span-3">
      <Show when={props.wishlistQuery.isLoading && !props.wishlistQuery.data}>
        <div class="border-t border-border py-16 text-center">
          <div class="mx-auto mb-4 h-px w-24 origin-left bg-primary animate-rule" />
          <div class="font-mono text-xs uppercase tracking-wide text-muted-foreground">
            Compiling your catalogue…
          </div>
        </div>
      </Show>

      <Show when={props.wishlistQuery.data}>
        <Show when={props.wishlistQuery.isFetching}>
          <div class="text-center py-2 mb-4">
            <div class="text-sm text-muted-foreground flex items-center justify-center gap-2">
              <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
              <span>Updating...</span>
            </div>
          </div>
        </Show>

        <Show when={!hasItems()}>
          <div class="flex flex-col items-center border-t border-border py-16 text-center">
            <FeatherMark class="mb-4 h-12 w-6" />
            <div class="font-serif text-lg text-muted-foreground">
              {props.searchQuery()
                ? `Nothing catalogued under "${props.searchQuery()}".`
                : "The catalogue is empty. Add your first entry."}
            </div>
          </div>
        </Show>

        <Show when={hasItems()}>
          <div class="border-t border-border">
            <For each={props.filteredItems()}>
              {(item: WishlistItem) => (
                <SortableWishlistItem
                  item={item}
                  onDelete={props.onDelete}
                  onEdit={props.onEdit}
                  onView={props.onView}
                  isSelectionMode={props.isSelectionMode}
                  isSelected={props.isSelected?.(item.id)}
                  onToggleSelect={props.onToggleSelect}
                />
              )}
            </For>
            <div class="flex flex-col gap-3 border-t border-border pt-4 font-mono text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
              <div>
                <Show
                  when={props.totalItems() > 0 && props.pageRange().start > 0}
                  fallback={<span>No entries to display</span>}
                >
                  {`Showing ${props.pageRange().start}–${props.pageRange().end} of ${props.totalItems()}`}
                </Show>
              </div>
              <div class="flex items-center gap-3">
                <Button
                  variant="link"
                  size="sm"
                  onClick={props.onPrevious}
                  disabled={!props.canGoPrevious()}
                >
                  ← Prev
                </Button>
                <span>
                  Page {props.displayPage()} / {props.displayTotalPages()}
                </span>
                <Button
                  variant="link"
                  size="sm"
                  onClick={props.onNext}
                  disabled={!props.canGoNext()}
                >
                  Next →
                </Button>
              </div>
            </div>
          </div>
        </Show>
      </Show>
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
  const [debouncedSearch, setDebouncedSearch] = createSignal("");
  const [sortBy, setSortBy] = createSignal<SortByOption>("custom");
  const [statusFilter, setStatusFilter] = createSignal<StatusFilter>("DEFAULT");
  const [page, setPage] = createSignal(1);
  const [addOpen, setAddOpen] = createSignal(false);
  const [editOpen, setEditOpen] = createSignal(false);
  const [editingItem, setEditingItem] = createSignal<WishlistItem | null>(null);
  const [viewOpen, setViewOpen] = createSignal(false);
  const [viewingItem, setViewingItem] = createSignal<WishlistItem | null>(null);
  const [viewingItemId, setViewingItemId] = createSignal("");
  const [categoryManagerOpen, setCategoryManagerOpen] = createSignal(false);
  const [bulkActionError, setBulkActionError] = createSignal<string | null>(
    null,
  );

  // Store timeout ID in a variable outside the effect
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  const navigate = useNavigate();
  const logoutMutation = useLogout();
  const deleteItemMutation = useDeleteItem();
  const createItemMutation = useCreateItem();
  const updateItemMutation = useUpdateItem();
  const addItemLinkMutation = useAddItemLink();
  const updateItemLinkMutation = useUpdateItemLink();
  const deleteItemLinkMutation = useDeleteItemLink();
  const batchDeleteMutation = useBatchDeleteItems();
  const batchMoveMutation = useBatchMoveItems();

  // Debounce search query
  createEffect(
    on(
      searchQuery,
      (query) => {
        // Clear existing timer
        if (debounceTimer) {
          clearTimeout(debounceTimer);
        }
        // Set new timer
        debounceTimer = setTimeout(() => {
          setDebouncedSearch(query);
          debounceTimer = null;
        }, 500);
      },
      { defer: true },
    ),
  );

  // Memoize filter to prevent unnecessary re-queries
  const filterMemo = createMemo(() => {
    const filter: Record<string, unknown> = {
      categoryId: selectedCategory() ?? undefined,
      search: debouncedSearch().trim() || undefined,
    };
    const currentStatusFilter = statusFilter();
    if (currentStatusFilter !== "DEFAULT") {
      filter.status = currentStatusFilter;
    }

    // Map local sort values to GraphQL sort keys
    const s = sortBy();
    if (s === "date") filter.sortBy = "CREATED_AT";
    else if (s === "title") filter.sortBy = "TITLE";
    else if (s === "priority") filter.sortBy = "PRIORITY";
    // "custom" → no sortBy (default server-side CREATED_AT DESC)

    return filter;
  });

  const paginationMemo = createMemo(() => ({
    page: page(),
    pageSize: PAGE_SIZE,
  }));

  // Fetch wishlist data using GraphQL
  const wishlistQuery = useWishlist(
    () => filterMemo(),
    () => paginationMemo(),
  );
  const viewingItemQuery = useItem(viewingItemId);

  // Adapt GraphQL data to component's expected format
  const wishlistData = createMemo(() => {
    if (!wishlistQuery.data) return undefined;
    return adaptWishlistData(wishlistQuery.data);
  });

  const items = createMemo(() => wishlistData()?.items ?? []);
  const pagination = createMemo(() => wishlistData()?.pagination ?? null);
  const categories = createMemo(() => wishlistData()?.categories ?? []);

  // Selection manager for bulk operations
  const selection = useSelectionManager({
    items,
    getId: (item) => item.id,
  });

  // Get current category name
  const currentCategoryName = createMemo(() => {
    const catId = selectedCategory();
    if (!catId) return "All Items";
    return categories().find((c) => c.id === catId)?.name || "All Items";
  });

  // Reset page when category or search changes
  // Use on() to explicitly track only the signals we care about
  createEffect(
    on(selectedCategory, () => {
      setPage(1);
    }),
  );

  createEffect(
    on(debouncedSearch, () => {
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
    status?: WishlistItemStatus;
    priority?: number;
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
        status: payload.status
          ? (payload.status.toUpperCase() as import("@repo/common/graphql/types").ItemStatus)
          : undefined,
        priority: payload.priority,
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

  // Reset page when sort or status filter changes
  createEffect(
    on([sortBy, statusFilter], () => {
      setPage(1);
    }),
  );

  const deleteItem = async (itemId: string) => {
    try {
      await deleteItemMutation.mutateAsync(itemId);
      if (viewingItem()?.id === itemId) {
        handleViewOpenChange(false);
      }
      // TanStack Query automatically refetches
    } catch (err) {
      console.error("Error deleting item:", err);
    }
  };

  // Bulk operation handlers
  const handleToggleSelectionMode = () => {
    setBulkActionError(null);
    if (selection.isSelectionMode()) {
      selection.exitSelectionMode();
    } else {
      selection.enterSelectionMode();
    }
  };

  const handleBatchDelete = async () => {
    try {
      setBulkActionError(null);
      const itemIds = selection.selectedIds();
      await batchDeleteMutation.mutateAsync(itemIds);
      selection.exitSelectionMode();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setBulkActionError(message);
      console.error("Bulk delete error:", err);
    }
  };

  const handleBatchMove = async (categoryId: string | null) => {
    try {
      setBulkActionError(null);
      const itemIds = selection.selectedIds();
      await batchMoveMutation.mutateAsync({ itemIds, categoryId });
      selection.exitSelectionMode();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setBulkActionError(message);
      console.error("Bulk move error:", err);
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
    const currentItems = items();

    if (!meta || meta.total_items === 0 || currentItems.length === 0) {
      return { start: 0, end: 0 };
    }

    const start = (meta.page - 1) * meta.page_size + 1;
    const end = Math.min(start + currentItems.length - 1, meta.total_items);
    return { start, end };
  });

  const openViewDialog = (item: WishlistItem) => {
    setViewingItemId(item.id);
    setViewingItem(item);
    setViewOpen(true);
  };

  const handleViewOpenChange = (open: boolean) => {
    setViewOpen(open);
    if (!open) {
      setViewingItemId("");
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
    status: import("@repo/common/types/wishlist-record").WishlistItemStatus;
    priority?: number;
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
          status:
            payload.status.toUpperCase() as import("@repo/common/graphql/types").ItemStatus,
          priority: payload.priority ?? null,
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
    if (updated && updated !== current) {
      setViewingItem(updated);
      return;
    }

    const fetched = viewingItemQuery.data;
    if (fetched && fetched.id === current.id) {
      const adapted = adaptItem(fetched);
      const linksChanged =
        JSON.stringify(adapted.links) !== JSON.stringify(current.links);
      if (
        adapted.updated_at !== current.updated_at ||
        adapted.description !== current.description ||
        linksChanged
      ) {
        setViewingItem(adapted);
      }
      return;
    }

    if (!updated && viewingItemQuery.isFetched && !fetched) {
      handleViewOpenChange(false);
    }
  });

  const handleCategoryRefetch = async () => {
    await wishlistQuery.refetch();
  };

  return (
    <div class="relative min-h-screen">
      <PaperBackground />
      <header class="relative border-b border-border">
        <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div class="flex items-center justify-between py-8">
            <div>
              <h1 class="font-display text-3xl font-semibold tracking-tight text-foreground">
                Corvus Wishlist
              </h1>
              <p class="mt-1 font-mono text-xs uppercase tracking-wide text-muted-foreground">
                Welcome back, {props.user.name}
              </p>
            </div>
            <div class="flex items-center gap-3">
              <ThemeToggle
                theme={theme.theme}
                setTheme={theme.setTheme}
                resolvedTheme={theme.resolvedTheme}
              />
              <A href="/profile">
                <Button variant="link">Profile</Button>
              </A>
              <Button variant="outline" onClick={handleLogout}>
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Show when={wishlistQuery.isError}>
          <div class="text-center py-12">
            <div class="text-destructive">
              Error loading wishlist:{" "}
              {wishlistQuery.error?.message || "Unknown error"}
            </div>
          </div>
        </Show>

        <div class="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Categories Sidebar */}
          <div class="lg:col-span-1">
            <Card class="border border-border bg-card">
              <CardHeader class="pb-4">
                <div class="flex items-center justify-between">
                  <div>
                    <CardTitle class="font-display text-xl text-card-foreground">
                      Categories
                    </CardTitle>
                    <CardDescription>Organize your wishlist</CardDescription>
                  </div>
                  <button
                    onClick={() => setCategoryManagerOpen(true)}
                    title="Manage Categories"
                    aria-label="Manage categories"
                    class="rounded-sm p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-primary"
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="1.5"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      aria-hidden="true"
                    >
                      <circle cx="12" cy="12" r="3" />
                      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
                    </svg>
                  </button>
                </div>
              </CardHeader>
              <CardContent class="px-6 pb-6">
                <div class="space-y-0.5">
                  <button
                    onClick={() => setSelectedCategory(null)}
                    class={`flex w-full items-baseline gap-2 border-l-2 px-3 py-2 text-left font-serif text-sm transition-colors ${
                      selectedCategory() === null
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-transparent text-foreground hover:bg-accent/40"
                    }`}
                  >
                    <span class="flex-1">All Items</span>
                    <span class="font-mono text-xs text-muted-foreground">
                      {totalItems()}
                    </span>
                  </button>
                  <For each={categories()}>
                    {(category: WishlistCategory) => (
                      <button
                        onClick={() => setSelectedCategory(category.id)}
                        class={`flex w-full items-center gap-2 border-l-2 px-3 py-2 text-left font-serif text-sm transition-colors ${
                          selectedCategory() === category.id
                            ? "border-primary bg-primary/5 text-primary"
                            : "border-transparent text-foreground hover:bg-accent/40"
                        }`}
                      >
                        <span
                          class="h-2 w-2 flex-shrink-0 rounded-full"
                          style={{
                            "background-color":
                              category.color || "hsl(var(--primary))",
                          }}
                        />
                        <span class="flex-1">{category.name}</span>
                      </button>
                    )}
                  </For>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Items Grid */}
          <div class="lg:col-span-3">
            {/* Search and Filter Controls - Always visible */}
            <WishlistFilters
              categoryName={currentCategoryName()}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              sortBy={sortBy}
              setSortBy={setSortBy}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              onAddItem={() => setAddOpen(true)}
              isSelectionMode={selection.isSelectionMode}
              onToggleSelectionMode={handleToggleSelectionMode}
              hasItems={items().length > 0}
            />

            <Show when={bulkActionError()}>
              <div class="text-center py-3">
                <div class="text-destructive text-sm">
                  Bulk action failed: {bulkActionError()}
                </div>
              </div>
            </Show>

            <RecentItemsWidget
              categories={categories()}
              onViewItem={openViewDialog}
            />

            <WishlistItemsSection
              wishlistQuery={wishlistQuery}
              filteredItems={items}
              searchQuery={searchQuery}
              totalItems={totalItems}
              pageRange={pageRange}
              displayPage={displayPage}
              displayTotalPages={displayTotalPages}
              pageSizeDisplay={pageSizeDisplay}
              canGoPrevious={canGoPrevious}
              canGoNext={canGoNext}
              onPrevious={() => {
                if (canGoPrevious()) {
                  setPage(Math.max(1, currentPage() - 1));
                }
              }}
              onNext={() => {
                if (canGoNext()) {
                  setPage(currentPage() + 1);
                }
              }}
              onDelete={deleteItem}
              onEdit={openEditDialog}
              onView={openViewDialog}
              isSelectionMode={selection.isSelectionMode()}
              isSelected={selection.isSelected}
              onToggleSelect={selection.toggleSelection}
            />
          </div>
        </div>
      </div>
      <AddItemDialog
        open={addOpen()}
        onOpenChange={setAddOpen}
        onSubmit={handleAddSubmit}
        categories={categories()}
        initialCategoryId={selectedCategory()}
        submitting={createItemMutation.isPending}
      />
      <EditItemDialog
        open={editOpen()}
        onOpenChange={setEditOpen}
        onSubmit={handleEditSubmit}
        categories={categories()}
        item={editingItem()}
        submitting={updateItemMutation.isPending}
      />
      <ViewItemDialog
        open={viewOpen()}
        onOpenChange={handleViewOpenChange}
        categories={categories()}
        item={viewingItem()}
      />
      <Show when={categoryManagerOpen()}>
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            data-testid="category-manager-backdrop"
            class="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setCategoryManagerOpen(false)}
          />
          <div class="relative z-50 w-full max-w-2xl">
            <CategoryManager
              categories={categories()}
              onRefetch={handleCategoryRefetch}
              onClose={() => setCategoryManagerOpen(false)}
            />
          </div>
        </div>
      </Show>

      {/* Bulk Action Bar */}
      <Show when={selection.isSelectionMode()}>
        <BulkActionBar
          selectedCount={selection.selectedCount}
          totalCount={() => items().length}
          allSelected={selection.allSelected}
          categories={categories}
          isProcessing={
            batchDeleteMutation.isPending || batchMoveMutation.isPending
          }
          onSelectAll={() => {
            if (selection.allSelected()) {
              selection.clearSelection();
            } else {
              selection.selectAll();
            }
          }}
          onClearSelection={selection.clearSelection}
          onCancel={selection.exitSelectionMode}
          onDelete={handleBatchDelete}
          onMove={handleBatchMove}
        />
      </Show>
    </div>
  );
}
