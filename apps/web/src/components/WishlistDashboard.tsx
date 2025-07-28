import { createSignal, createResource, For, Show } from "solid-js";
import { A } from "@solidjs/router";
import { Button } from "@repo/ui-components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui-components/card";
import type { WishlistCategory, WishlistItem } from "../lib/db/types";

interface WishlistDashboardProps {
  user: {
    id: number;
    name: string;
    email: string;
  };
}

export function WishlistDashboard(props: WishlistDashboardProps) {
  const [selectedCategory, setSelectedCategory] = createSignal<string | null>(
    null,
  );

  // Fetch wishlist data
  const [wishlistData] = createResource(async () => {
    const response = await fetch("/api/wishlist");

    if (!response.ok) {
      throw new Error("Failed to fetch wishlist data");
    }

    return response.json();
  });

  const filteredItems = () => {
    const data = wishlistData();
    if (!data || !selectedCategory()) return data?.items || [];

    return data.items.filter(
      (item: WishlistItem) => item.category_id === selectedCategory(),
    );
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
      // Refresh data
      wishlistData.refetch();
    }
  };

  const deleteItem = async (itemId: string) => {
    const response = await fetch(`/api/wishlist/items/${itemId}`, {
      method: "DELETE",
    });

    if (response.ok) {
      wishlistData.refetch();
    }
  };

  return (
    <div class="min-h-screen bg-gray-50">
      {/* Header */}
      <header class="bg-white shadow-sm border-b">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex justify-between items-center py-4">
            <div>
              <h1 class="text-2xl font-bold text-gray-900">Corvus Wishlist</h1>
              <p class="text-sm text-gray-600">
                Welcome back, {props.user.name}!
              </p>
            </div>
            <A href="/api/auth/logout">
              <Button variant="outline">Sign Out</Button>
            </A>
          </div>
        </div>
      </header>

      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Show when={wishlistData.loading}>
          <div class="text-center py-12">
            <div class="text-gray-500">Loading your wishlist...</div>
          </div>
        </Show>

        <Show when={wishlistData.error}>
          <div class="text-center py-12">
            <div class="text-red-600">
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
                          ? "bg-blue-100 text-blue-700"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      All Items ({wishlistData()?.items?.length || 0})
                    </button>
                    <For each={wishlistData()?.categories || []}>
                      {(category: WishlistCategory) => (
                        <button
                          onClick={() => setSelectedCategory(category.id)}
                          class={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                            selectedCategory() === category.id
                              ? "bg-blue-100 text-blue-700"
                              : "text-gray-700 hover:bg-gray-100"
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
                            <span class="text-xs text-gray-500">
                              (
                              {wishlistData()?.items?.filter(
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
              <div class="flex justify-between items-center mb-6">
                <h2 class="text-xl font-semibold text-gray-900">
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

              <Show when={filteredItems().length === 0}>
                <Card>
                  <CardContent class="text-center py-12">
                    <div class="text-gray-500">
                      No items in this category yet. Add your first item!
                    </div>
                  </CardContent>
                </Card>
              </Show>

              <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                <For each={filteredItems()}>
                  {(item: WishlistItem) => (
                    <Card>
                      <CardContent class="p-4">
                        <div class="flex items-start justify-between">
                          <div class="flex-1">
                            <h3 class="font-medium text-gray-900 mb-1">
                              {item.title}
                            </h3>
                            <a
                              href={item.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              class="text-sm text-blue-600 hover:text-blue-500 break-all"
                            >
                              {item.url}
                            </a>
                            <Show when={item.description}>
                              <p class="text-sm text-gray-600 mt-2">
                                {item.description}
                              </p>
                            </Show>
                            <div class="text-xs text-gray-500 mt-2">
                              Added{" "}
                              {new Date(item.created_at).toLocaleDateString()}
                            </div>
                          </div>
                          <button
                            onClick={() => deleteItem(item.id)}
                            class="text-red-600 hover:text-red-500 ml-2"
                            title="Delete item"
                          >
                            ×
                          </button>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </For>
              </div>
            </div>
          </div>
        </Show>
      </div>
    </div>
  );
}
