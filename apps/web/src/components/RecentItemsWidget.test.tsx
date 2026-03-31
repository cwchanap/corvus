import { render, screen } from "@solidjs/testing-library";
import { describe, expect, it, vi, beforeEach } from "vitest";
import type { GraphQLWishlistItem } from "@repo/common/graphql/types";
import type {
  WishlistCategoryRecord,
  WishlistItemRecord,
} from "@repo/common/types/wishlist-record";
import { RecentItemsWidget } from "./RecentItemsWidget";

const mockUseRecentItems = vi.fn();
const mockAdaptItem = vi.fn();

vi.mock("../lib/graphql/hooks/use-wishlist", () => ({
  useRecentItems: () => mockUseRecentItems(),
}));

vi.mock("../lib/graphql/adapters", () => ({
  adaptItem: (item: GraphQLWishlistItem) => mockAdaptItem(item),
}));

vi.mock("@repo/common/utils/format-relative-time", () => ({
  formatRelativeTime: () => "just now",
}));

describe("RecentItemsWidget", () => {
  const categories: WishlistCategoryRecord[] = [
    {
      id: "cat-1",
      user_id: "user-1",
      name: "Electronics",
      color: "#6366f1",
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
    },
  ];

  const recentItem: GraphQLWishlistItem = {
    id: "item-1",
    title: "Laptop",
    description: null,
    categoryId: "cat-1",
    favicon: null,
    status: "WANT",
    priority: null,
    userId: "user-1",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-02T00:00:00Z",
    links: [],
  };

  const adaptedItem: WishlistItemRecord = {
    id: "item-1",
    user_id: "user-1",
    category_id: "cat-1",
    title: "Laptop",
    description: undefined,
    favicon: undefined,
    status: "want",
    priority: undefined,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-02T00:00:00Z",
    links: [],
  };

  beforeEach(() => {
    mockUseRecentItems.mockReset();
    mockAdaptItem.mockReset();
    mockUseRecentItems.mockReturnValue({ data: [recentItem] });
    mockAdaptItem.mockReturnValue(adaptedItem);
  });

  it("memoizes adapted recent items across multiple reads in one render", () => {
    render(() => (
      <RecentItemsWidget categories={categories} onViewItem={vi.fn()} />
    ));

    expect(screen.getByText("Recently Added")).toBeInTheDocument();
    expect(mockAdaptItem).toHaveBeenCalledTimes(1);
  });
});
