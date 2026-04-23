import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import {
  render,
  screen,
  fireEvent,
  cleanup,
  waitFor,
} from "@solidjs/testing-library";
import { WishlistView } from "../../src/components/WishlistView";
import type { GraphQLWishlistPayload } from "@repo/common/graphql/types";

const mockRefetch = vi.fn();
const mockSetPage = vi.fn();
const mockSetCategoryId = vi.fn();
const mockDeleteItem = vi.fn();

const mockApi = {
  createCategory: vi.fn(),
  updateCategory: vi.fn(),
  deleteCategory: vi.fn(),
  createItem: vi.fn(),
  updateItem: vi.fn(),
  deleteItem: mockDeleteItem,
  addItemLink: vi.fn(),
  updateItemLink: vi.fn(),
  deleteItemLink: vi.fn(),
  setPrimaryLink: vi.fn(),
  getWishlist: vi.fn(),
  getCategories: vi.fn(),
  getItem: vi.fn(),
};

const mockWishlistData: GraphQLWishlistPayload = {
  categories: [
    {
      id: "cat-1",
      name: "Electronics",
      color: "#3b82f6",
      userId: "user-1",
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-01T00:00:00Z",
    },
  ],
  items: [
    {
      id: "item-1",
      title: "Laptop",
      description: "A great laptop",
      categoryId: "cat-1",
      favicon: "https://example.com/favicon.ico",
      status: "WANT",
      priority: 0,
      userId: "user-1",
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-01T00:00:00Z",
      links: [
        {
          id: "link-1",
          url: "https://example.com/laptop",
          description: "Buy here",
          itemId: "item-1",
          isPrimary: true,
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        },
      ],
    },
    {
      id: "item-2",
      title: "Headphones",
      description: null,
      categoryId: "cat-1",
      favicon: null,
      status: "WANT",
      priority: 1,
      userId: "user-1",
      createdAt: "2024-01-02T00:00:00Z",
      updatedAt: "2024-01-02T00:00:00Z",
      links: [],
    },
  ],
  pagination: {
    totalItems: 2,
    page: 1,
    pageSize: 5,
    totalPages: 1,
    hasNext: false,
    hasPrevious: false,
  },
};

let mockValue = () => mockWishlistData as GraphQLWishlistPayload | undefined;
let mockStateValue = () => "ready" as string;
let mockErrorValue = () => undefined as unknown;
let mockPageValue = () => 1;
let mockCategoryIdValue = () => null as string | null;

vi.mock("../../src/lib/wishlist/context", () => ({
  useWishlistData: () => ({
    value: () => mockValue(),
    state: () => mockStateValue(),
    error: () => mockErrorValue(),
    refetch: mockRefetch,
    api: mockApi,
    page: () => mockPageValue(),
    setPage: mockSetPage,
    pageSize: 5,
    categoryId: () => mockCategoryIdValue(),
    setCategoryId: mockSetCategoryId,
  }),
}));

vi.mock("../../src/lib/theme/context", () => ({
  useTheme: () => ({
    theme: () => "light",
    setTheme: vi.fn(),
    resolvedTheme: () => "light",
  }),
}));

beforeEach(() => {
  mockValue = () => mockWishlistData;
  mockStateValue = () => "ready";
  mockErrorValue = () => undefined;
  mockPageValue = () => 1;
  mockCategoryIdValue = () => null;
  mockRefetch.mockReset().mockResolvedValue(undefined);
  mockDeleteItem.mockReset().mockResolvedValue(undefined);
  mockSetPage.mockReset();
  mockSetCategoryId.mockReset();
  vi.spyOn(window, "alert").mockImplementation(() => {});
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("WishlistView", () => {
  it("renders 'My Wishlist' heading", () => {
    render(() => <WishlistView />);
    expect(screen.getByText("My Wishlist")).toBeInTheDocument();
  });

  it("shows loading fallback when data is not available", () => {
    mockValue = () => undefined;
    mockStateValue = () => "pending";
    render(() => <WishlistView />);
    expect(screen.getByText("Loading wishlist…")).toBeInTheDocument();
  });

  it("shows error message when state is errored", () => {
    mockValue = () => undefined;
    mockStateValue = () => "errored";
    mockErrorValue = () => new Error("Auth failed");
    render(() => <WishlistView />);
    expect(screen.getByText("Auth failed")).toBeInTheDocument();
  });

  it("shows default error message when error is not an Error instance", () => {
    mockValue = () => undefined;
    mockStateValue = () => "errored";
    mockErrorValue = () => "bad";
    render(() => <WishlistView />);
    expect(
      screen.getByText("Unable to load your wishlist. Please sign in."),
    ).toBeInTheDocument();
  });

  it("renders item titles when data is loaded", () => {
    render(() => <WishlistView />);
    expect(screen.getByText("Laptop")).toBeInTheDocument();
    expect(screen.getByText("Headphones")).toBeInTheDocument();
  });

  it("shows item description when present", () => {
    render(() => <WishlistView />);
    expect(screen.getByText("A great laptop")).toBeInTheDocument();
  });

  it("shows link count for each item", () => {
    render(() => <WishlistView />);
    expect(screen.getByText("1 link")).toBeInTheDocument();
    expect(screen.getByText("0 links")).toBeInTheDocument();
  });

  it("shows category filter dropdown", () => {
    render(() => <WishlistView />);
    expect(screen.getByText("Filter by Category")).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: "Electronics" }),
    ).toBeInTheDocument();
  });

  it("calls setCategoryId with null when 'all' is selected", () => {
    render(() => <WishlistView />);
    const select = screen.getByRole("combobox");
    fireEvent.change(select, { target: { value: "all" } });
    expect(mockSetCategoryId).toHaveBeenCalledWith(null);
  });

  it("calls setCategoryId with category id when category is selected", () => {
    render(() => <WishlistView />);
    const select = screen.getByRole("combobox");
    fireEvent.change(select, { target: { value: "cat-1" } });
    expect(mockSetCategoryId).toHaveBeenCalledWith("cat-1");
  });

  it("shows onAddNew button when prop is provided", () => {
    const onAddNew = vi.fn();
    render(() => <WishlistView onAddNew={onAddNew} />);
    const btn = screen.getByRole("button", { name: "Add Page" });
    fireEvent.click(btn);
    expect(onAddNew).toHaveBeenCalledOnce();
  });

  it("shows onManageCategories button when prop is provided", () => {
    const onManageCategories = vi.fn();
    render(() => <WishlistView onManageCategories={onManageCategories} />);
    const btn = screen.getByRole("button", { name: "Categories" });
    fireEvent.click(btn);
    expect(onManageCategories).toHaveBeenCalledOnce();
  });

  it("calls deleteItem and refetch when Remove is clicked", async () => {
    render(() => <WishlistView />);
    const removeButtons = screen.getAllByRole("button", { name: "Remove" });
    fireEvent.click(removeButtons[0]!);

    await waitFor(() => {
      expect(mockDeleteItem).toHaveBeenCalledWith("item-1");
      expect(mockRefetch).toHaveBeenCalled();
    });
  });

  it("shows alert on deleteItem error (Error instance)", async () => {
    mockDeleteItem.mockRejectedValueOnce(new Error("Server error"));
    render(() => <WishlistView />);
    const removeButtons = screen.getAllByRole("button", { name: "Remove" });
    fireEvent.click(removeButtons[0]!);

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith("Server error");
    });
  });

  it("shows generic alert on deleteItem error (non-Error)", async () => {
    mockDeleteItem.mockRejectedValueOnce("unknown");
    render(() => <WishlistView />);
    const removeButtons = screen.getAllByRole("button", { name: "Remove" });
    fireEvent.click(removeButtons[0]!);

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith("Failed to remove item");
    });
  });

  it("opens ItemDetailsModal when item title is clicked", async () => {
    render(() => <WishlistView />);
    const laptopTitle = screen.getByText("Laptop");
    fireEvent.click(laptopTitle.closest("button")!);

    await waitFor(() => {
      // ItemDetailsModal should now show the detail view
      expect(screen.getByText("Buy here")).toBeInTheDocument();
    });
  });

  it("closes ItemDetailsModal when × is clicked", async () => {
    render(() => <WishlistView />);
    fireEvent.click(screen.getByText("Laptop").closest("button")!);

    await waitFor(() => screen.getByText("Buy here"));
    fireEvent.click(screen.getByText("×"));

    await waitFor(() => {
      expect(screen.queryByText("Buy here")).toBeNull();
    });
  });

  it("calls chrome.tabs.create when a link is opened from modal", async () => {
    render(() => <WishlistView />);
    fireEvent.click(screen.getByText("Laptop").closest("button")!);

    await waitFor(() => screen.getByText("Buy here"));
    fireEvent.click(screen.getByText("Buy here"));

    expect(chrome.tabs.create).toHaveBeenCalledWith({
      url: "https://example.com/laptop",
    });
  });

  it("shows empty state when no items in selected category", () => {
    mockValue = () => ({
      ...mockWishlistData,
      items: [],
      pagination: { ...mockWishlistData.pagination, totalItems: 0 },
    });
    render(() => <WishlistView />);
    expect(
      screen.getByText("No items in this category yet"),
    ).toBeInTheDocument();
  });

  it("shows Prev/Next pagination buttons", () => {
    render(() => <WishlistView />);
    expect(screen.getByRole("button", { name: "Prev" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Next" })).toBeInTheDocument();
  });

  it("Prev button is disabled when hasPrevious is false", () => {
    render(() => <WishlistView />);
    expect(screen.getByRole("button", { name: "Prev" })).toBeDisabled();
  });

  it("Next button is disabled when hasNext is false", () => {
    render(() => <WishlistView />);
    expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
  });

  it("clicking Next calls setPage with incremented page when hasNext is true", async () => {
    mockValue = () => ({
      ...mockWishlistData,
      pagination: {
        ...mockWishlistData.pagination,
        hasNext: true,
        totalPages: 2,
      },
    });
    render(() => <WishlistView />);
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(mockSetPage).toHaveBeenCalledWith(2);
  });

  it("clicking Prev calls setPage with decremented page when hasPrevious is true", async () => {
    mockPageValue = () => 2;
    mockValue = () => ({
      ...mockWishlistData,
      pagination: {
        ...mockWishlistData.pagination,
        page: 2,
        hasPrevious: true,
        totalPages: 2,
      },
    });
    render(() => <WishlistView />);
    fireEvent.click(screen.getByRole("button", { name: "Prev" }));
    expect(mockSetPage).toHaveBeenCalledWith(1);
  });

  it("shows page range info when there are items", () => {
    render(() => <WishlistView />);
    expect(screen.getByText(/Showing 1–2 of 2/)).toBeInTheDocument();
  });

  it("shows category badge on each item", () => {
    render(() => <WishlistView />);
    const badges = screen.getAllByText("Electronics");
    expect(badges.length).toBeGreaterThan(0);
  });

  it("shows favicon image when item has favicon", () => {
    render(() => <WishlistView />);
    const favicons = document.querySelectorAll(
      'img[src="https://example.com/favicon.ico"]',
    );
    expect(favicons.length).toBeGreaterThan(0);
  });
});
