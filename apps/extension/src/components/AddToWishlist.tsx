import { createSignal, createResource, For, Show } from "solid-js";
import { Button } from "@repo/ui-components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@repo/ui-components/card";
import { Input } from "@repo/ui-components/input";
import { Select } from "@repo/ui-components/select";
import { getCurrentPageInfo } from "../utils/page-info.js";
import { WishlistApiError } from "@repo/common/api/wishlist-client";
import { useWishlistData } from "../lib/wishlist/context.js";
import type { WishlistItem } from "../types/wishlist";

interface AddToWishlistProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

const NEW_ITEM_OPTION_VALUE = "__create_new_item__";
export function AddToWishlist(props: AddToWishlistProps) {
  const [selectedCategoryId, setSelectedCategoryId] = createSignal("all");
  const [selectedItemId, setSelectedItemId] = createSignal<string>("");
  const [linkDescription, setLinkDescription] = createSignal("");
  const [isAddingLink, setIsAddingLink] = createSignal(false);

  const [isNewItemModalOpen, setIsNewItemModalOpen] = createSignal(false);
  const [newItemCategoryId, setNewItemCategoryId] = createSignal("");
  const [customTitle, setCustomTitle] = createSignal("");
  const [customDescription, setCustomDescription] = createSignal("");
  const [isCreatingNewItem, setIsCreatingNewItem] = createSignal(false);

  const [pageInfo] = createResource(getCurrentPageInfo);
  const {
    value: wishlistValue,
    state: wishlistState,
    error: wishlistError,
    refetch: refetchWishlist,
    api: wishlistApi,
  } = useWishlistData();

  const isWishlistErrored = () => wishlistState() === "errored";
  const resolvedWishlist = () => wishlistValue();
  const wishlistErrorMessage = () => {
    const error = wishlistError();
    if (error instanceof WishlistApiError) return error.message;
    if (error instanceof Error) return error.message;
    return "Unable to load wishlist data. Please sign in.";
  };
  const hasCategories = () => Boolean(resolvedWishlist()?.categories.length);

  const filteredItems = (): WishlistItem[] => {
    const data = resolvedWishlist();
    if (!data) return [];

    const categoryId = selectedCategoryId();
    if (!categoryId || categoryId === "all") return data.items;

    return data.items.filter((item) => item.categoryId === categoryId);
  };

  const resetNewItemForm = () => {
    const page = pageInfo();
    setCustomTitle(page?.title ?? "");
    setCustomDescription("");
  };

  const closeNewItemModal = () => {
    setIsNewItemModalOpen(false);
    setNewItemCategoryId("");
    resetNewItemForm();
  };

  const openNewItemModal = () => {
    const data = resolvedWishlist();
    if (data?.categories.length) {
      const currentSelection = selectedCategoryId();
      const fallbackCategory =
        currentSelection && currentSelection !== "all"
          ? currentSelection
          : data.categories[0]!.id;
      setNewItemCategoryId(fallbackCategory);
    } else {
      setNewItemCategoryId("");
    }

    resetNewItemForm();
    setIsNewItemModalOpen(true);
  };

  const handleItemSelection = (value: string) => {
    if (value === NEW_ITEM_OPTION_VALUE) {
      setSelectedItemId("");
      openNewItemModal();
      return;
    }

    setSelectedItemId(value);
  };

  const handleAddToExistingItem = async () => {
    const page = pageInfo();
    const itemId = selectedItemId();
    if (!page || !itemId) return;

    setIsAddingLink(true);
    try {
      await wishlistApi.addItemLink(itemId, {
        url: page.url,
        description: linkDescription() || undefined,
        isPrimary: false,
      });
      await refetchWishlist();
      setLinkDescription("");
      props.onSuccess?.();
    } catch (error) {
      console.error("Error adding link to existing item:", error);
      alert("Failed to add link to item. Please try again.");
    } finally {
      setIsAddingLink(false);
    }
  };

  const handleCreateNewItem = async () => {
    const page = pageInfo();
    if (!page) return;

    const categoryId = newItemCategoryId();
    if (!categoryId) {
      alert("Please choose a category before creating an item.");
      return;
    }

    setIsCreatingNewItem(true);
    try {
      const title = customTitle() || page.title;
      const description = customDescription() || undefined;

      await wishlistApi.createItem({
        title,
        description,
        categoryId,
        favicon: page.favicon,
        url: page.url,
        linkDescription: linkDescription() || undefined,
      });

      await refetchWishlist();
      setSelectedItemId("");
      setLinkDescription("");
      setIsNewItemModalOpen(false);
      props.onSuccess?.();
    } catch (error) {
      console.error("Error creating new item:", error);
      alert("Failed to create item. Please try again.");
    } finally {
      setIsCreatingNewItem(false);
      resetNewItemForm();
    }
  };

  const renderCategoryFilter = () => (
    <div class="space-y-2">
      <label class="text-sm font-medium">Category</label>
      <Show
        when={resolvedWishlist()}
        fallback={
          <div class="text-sm text-muted-foreground">
            {isWishlistErrored() ? wishlistErrorMessage() : "Loading…"}
          </div>
        }
      >
        {(data) => (
          <Select
            value={selectedCategoryId()}
            onChange={(e) => setSelectedCategoryId(e.currentTarget.value)}
          >
            <option value="all">All Categories</option>
            <For each={data().categories}>
              {(category) => (
                <option value={category.id}>{category.name}</option>
              )}
            </For>
          </Select>
        )}
      </Show>
    </div>
  );

  const renderItemSelection = () => (
    <div class="space-y-2">
      <label class="text-sm font-medium">Select Item</label>
      <Show
        when={resolvedWishlist()}
        fallback={
          <div class="text-sm text-muted-foreground">
            {isWishlistErrored() ? wishlistErrorMessage() : "Loading…"}
          </div>
        }
      >
        <>
          <Select
            value={selectedItemId()}
            onChange={(e) => handleItemSelection(e.currentTarget.value)}
          >
            <option value="">Choose an item…</option>
            <For each={filteredItems()}>
              {(item) => (
                <option value={item.id}>
                  {item.title} ({item.links?.length || 0} links)
                </option>
              )}
            </For>
            <option value={NEW_ITEM_OPTION_VALUE}>+ Create new item</option>
          </Select>
          <Show when={filteredItems().length === 0}>
            <div class="flex items-center justify-between rounded border border-dashed border-input bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
              <span>No items found in this category.</span>
              <Button
                size="sm"
                variant="link"
                class="p-0 text-xs"
                onClick={openNewItemModal}
                disabled={isWishlistErrored()}
              >
                Create one
              </Button>
            </div>
          </Show>
        </>
      </Show>
    </div>
  );

  const renderLinkDescriptionInput = () => (
    <div class="space-y-2">
      <label class="text-sm font-medium">Link Description (optional)</label>
      <Input
        type="text"
        placeholder="e.g., 'Official site', 'Product page'…"
        value={linkDescription()}
        onInput={(e) => setLinkDescription(e.currentTarget.value)}
      />
    </div>
  );

  return (
    <>
      <Card class="w-full">
        <CardHeader>
          <div class="flex items-center justify-between">
            <CardTitle class="text-base">Add to Wishlist</CardTitle>
            <Show when={props.onCancel}>
              <Button variant="ghost" size="sm" onClick={props.onCancel}>
                Back
              </Button>
            </Show>
          </div>
        </CardHeader>
        <CardContent class="space-y-4">
          <Show
            when={pageInfo()}
            fallback={
              <div class="text-sm text-muted-foreground">
                Loading page info...
              </div>
            }
          >
            {(page) => (
              <>
                <div class="space-y-2">
                  <div class="flex items-start gap-2">
                    <Show when={page().favicon}>
                      <img
                        src={page().favicon}
                        alt=""
                        class="h-4 w-4 flex-shrink-0"
                      />
                    </Show>
                    <div class="min-w-0 flex-1">
                      <div
                        class="text-sm font-medium truncate"
                        title={page().title}
                      >
                        {page().title}
                      </div>
                      <div
                        class="text-xs text-muted-foreground truncate"
                        title={page().url}
                      >
                        {page().url}
                      </div>
                    </div>
                  </div>
                </div>

                <div class="space-y-3">
                  {renderCategoryFilter()}
                  {renderItemSelection()}
                  {renderLinkDescriptionInput()}
                </div>

                <div class="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    onClick={handleAddToExistingItem}
                    disabled={
                      isAddingLink() ||
                      !selectedItemId() ||
                      filteredItems().length === 0
                    }
                    class="flex-1"
                  >
                    {isAddingLink() ? "Adding..." : "Add Link"}
                  </Button>
                  <Show when={props.onCancel}>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={props.onCancel}
                      disabled={isAddingLink()}
                    >
                      Cancel
                    </Button>
                  </Show>
                </div>
              </>
            )}
          </Show>
        </CardContent>
      </Card>

      <Show when={isNewItemModalOpen()}>
        <div
          class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          onClick={() => {
            if (!isCreatingNewItem()) {
              closeNewItemModal();
            }
          }}
        >
          <div
            class="w-full max-w-md"
            onClick={(event) => event.stopPropagation()}
          >
            <Card>
              <CardHeader>
                <div class="flex items-center justify-between">
                  <CardTitle class="text-base">Create New Item</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={closeNewItemModal}
                    disabled={isCreatingNewItem()}
                  >
                    ✕
                  </Button>
                </div>
              </CardHeader>
              <CardContent class="space-y-3">
                <div class="space-y-2">
                  <label class="text-sm font-medium">Category</label>
                  <Show when={resolvedWishlist()}>
                    {(data) => (
                      <Select
                        value={newItemCategoryId()}
                        onChange={(e) =>
                          setNewItemCategoryId(e.currentTarget.value)
                        }
                      >
                        <For each={data().categories}>
                          {(category) => (
                            <option value={category.id}>{category.name}</option>
                          )}
                        </For>
                      </Select>
                    )}
                  </Show>
                </div>

                <div class="space-y-2">
                  <label class="text-sm font-medium">
                    Title (optional - uses page title)
                  </label>
                  <Input
                    type="text"
                    placeholder={pageInfo()?.title}
                    value={customTitle()}
                    onInput={(e) => setCustomTitle(e.currentTarget.value)}
                  />
                </div>

                <div class="space-y-2">
                  <label class="text-sm font-medium">
                    Description (optional)
                  </label>
                  <textarea
                    placeholder="Add a note about this item..."
                    value={customDescription()}
                    onInput={(e) => setCustomDescription(e.currentTarget.value)}
                    class="flex min-h-[80px] w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    rows="2"
                  />
                </div>

                <div class="flex justify-end gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={closeNewItemModal}
                    disabled={isCreatingNewItem()}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleCreateNewItem}
                    disabled={isCreatingNewItem() || !hasCategories()}
                  >
                    {isCreatingNewItem() ? "Creating..." : "Create Item"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </Show>
    </>
  );
}
