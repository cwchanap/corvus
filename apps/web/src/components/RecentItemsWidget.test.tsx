import { fireEvent, render, screen } from "@solidjs/testing-library";
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
  parseDateAsUTC: (s: string) =>
    new Date(s.includes(" ") ? s.replace(" ", "T") + "Z" : s),
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
    mockUseRecentItems.mockReturnValue({
      data: [recentItem],
      isLoading: false,
      error: null,
    });
    mockAdaptItem.mockReturnValue(adaptedItem);
  });

  it("memoizes adapted recent items across multiple reads in one render", () => {
    render(() => (
      <RecentItemsWidget categories={categories} onViewItem={vi.fn()} />
    ));

    expect(screen.getByText("Recently Added")).toBeInTheDocument();
    expect(mockAdaptItem).toHaveBeenCalledTimes(1);
  });

  it("renders nothing when query returns empty data", () => {
    mockUseRecentItems.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    });
    const { container } = render(() => (
      <RecentItemsWidget categories={categories} onViewItem={vi.fn()} />
    ));
    expect(container.firstChild).toBeNull();
  });

  it("renders nothing when query returns undefined data and no error", () => {
    mockUseRecentItems.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
    });
    const { container } = render(() => (
      <RecentItemsWidget categories={categories} onViewItem={vi.fn()} />
    ));
    expect(container.firstChild).toBeNull();
  });

  it("shows loading skeletons while fetching", () => {
    mockUseRecentItems.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    });
    render(() => (
      <RecentItemsWidget categories={categories} onViewItem={vi.fn()} />
    ));
    expect(screen.getByText("Recently Added")).toBeInTheDocument();
    const skeletons = document.querySelectorAll(".animate-pulse");
    expect(skeletons.length).toBe(3);
  });

  it("shows error message when query fails", () => {
    mockUseRecentItems.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error("Network failure"),
    });
    render(() => (
      <RecentItemsWidget categories={categories} onViewItem={vi.fn()} />
    ));
    expect(
      screen.getByText("Could not load recent items."),
    ).toBeInTheDocument();
  });

  it("calls onViewItem with the item when a row is clicked", async () => {
    mockUseRecentItems.mockReturnValue({
      data: [recentItem],
      isLoading: false,
      error: null,
    });
    mockAdaptItem.mockReturnValue(adaptedItem);

    const onViewItem = vi.fn();
    render(() => (
      <RecentItemsWidget categories={categories} onViewItem={onViewItem} />
    ));

    fireEvent.click(screen.getByText("Laptop"));
    expect(onViewItem).toHaveBeenCalledWith(adaptedItem);
  });

  it("shows the category name when categoryId matches", () => {
    mockUseRecentItems.mockReturnValue({
      data: [recentItem],
      isLoading: false,
      error: null,
    });
    mockAdaptItem.mockReturnValue(adaptedItem);

    render(() => (
      <RecentItemsWidget categories={categories} onViewItem={vi.fn()} />
    ));

    expect(screen.getByText("Electronics")).toBeInTheDocument();
  });

  it("shows 'Uncategorized' when categoryId does not match any category", () => {
    const itemWithUnknownCategory = {
      ...recentItem,
      categoryId: "unknown-cat",
    };
    const adaptedWithUnknownCategory = {
      ...adaptedItem,
      category_id: "unknown-cat",
    };
    mockUseRecentItems.mockReturnValue({
      data: [itemWithUnknownCategory],
      isLoading: false,
      error: null,
    });
    mockAdaptItem.mockReturnValue(adaptedWithUnknownCategory);

    render(() => (
      <RecentItemsWidget categories={categories} onViewItem={vi.fn()} />
    ));

    expect(screen.getByText("Uncategorized")).toBeInTheDocument();
  });

  it("renders tooltip with UTC-parsed timestamp for SQLite format dates", () => {
    const sqliteTimestamp = "2024-01-01 00:00:00";
    const adaptedWithSqliteTs = {
      ...adaptedItem,
      created_at: sqliteTimestamp,
    };
    mockUseRecentItems.mockReturnValue({
      data: [recentItem],
      isLoading: false,
      error: null,
    });
    mockAdaptItem.mockReturnValue(adaptedWithSqliteTs);

    render(() => (
      <RecentItemsWidget categories={categories} onViewItem={vi.fn()} />
    ));

    const timeElement = screen.getByText("just now");
    // The tooltip should use parseDateAsUTC which converts SQLite format
    // "2024-01-01 00:00:00" → "2024-01-01T00:00:00Z" before calling toLocaleString().
    // Verify the title is a non-empty locale string (not the raw SQLite format).
    expect(timeElement.title).toBeTruthy();
    expect(timeElement.title).not.toBe(sqliteTimestamp);
  });
});
