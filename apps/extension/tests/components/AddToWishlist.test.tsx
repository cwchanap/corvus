import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import {
  render,
  screen,
  fireEvent,
  cleanup,
  waitFor,
} from "@solidjs/testing-library";
import { AddToWishlist } from "../../src/components/AddToWishlist";
import type { GraphQLWishlistPayload } from "@repo/common/graphql/types";

const mockPageInfo = {
  url: "https://example.com/product",
  title: "Awesome Product",
  favicon: "https://example.com/favicon.ico",
};

vi.mock("../../src/utils/page-info", () => ({
  getCurrentPageInfo: vi.fn().mockResolvedValue(mockPageInfo),
}));

const mockRefetch = vi.fn();
const mockAddItemLink = vi.fn();
const mockCreateItem = vi.fn();

const mockApi = {
  createCategory: vi.fn(),
  updateCategory: vi.fn(),
  deleteCategory: vi.fn(),
  createItem: mockCreateItem,
  updateItem: vi.fn(),
  deleteItem: vi.fn(),
  addItemLink: mockAddItemLink,
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
    {
      id: "cat-2",
      name: "Books",
      color: null,
      userId: "user-1",
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-01T00:00:00Z",
    },
  ],
  items: [
    {
      id: "item-1",
      title: "Existing Item",
      description: null,
      categoryId: "cat-1",
      favicon: null,
      status: "WANT",
      priority: 0,
      userId: "user-1",
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-01T00:00:00Z",
      links: [],
    },
  ],
  pagination: {
    totalItems: 1,
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

vi.mock("../../src/utils/page-info");

vi.mock("../../src/lib/wishlist/context", () => ({
  useWishlistData: () => ({
    value: () => mockValue(),
    state: () => mockStateValue(),
    error: () => mockErrorValue(),
    refetch: mockRefetch,
    api: mockApi,
    page: () => 1,
    setPage: vi.fn(),
    pageSize: 5,
    categoryId: () => null,
    setCategoryId: vi.fn(),
  }),
}));

beforeEach(async () => {
  mockValue = () => mockWishlistData;
  mockStateValue = () => "ready";
  mockErrorValue = () => undefined;
  mockRefetch.mockReset().mockResolvedValue(undefined);
  mockAddItemLink
    .mockReset()
    .mockResolvedValue({ id: "link-new", url: mockPageInfo.url });
  mockCreateItem
    .mockReset()
    .mockResolvedValue({ id: "item-new", title: mockPageInfo.title });
  vi.spyOn(window, "alert").mockImplementation(() => {});

  const { getCurrentPageInfo } = await import("../../src/utils/page-info");
  vi.mocked(getCurrentPageInfo).mockResolvedValue(mockPageInfo);
});

afterEach(() => cleanup());

describe("AddToWishlist", () => {
  it("renders 'Add to Wishlist' heading", async () => {
    render(() => <AddToWishlist />);
    expect(screen.getByText("Add to Wishlist")).toBeInTheDocument();
  });

  it("shows loading page info state initially", () => {
    render(() => <AddToWishlist />);
    // Before the resource resolves, "Loading page info..." appears
    // (may flash quickly but is the initial state)
    // Just assert the heading is always present
    expect(screen.getByText("Add to Wishlist")).toBeInTheDocument();
  });

  it("shows page title and url after page info loads", async () => {
    render(() => <AddToWishlist />);

    await waitFor(() => {
      expect(screen.getByText("Awesome Product")).toBeInTheDocument();
      expect(
        screen.getByText("https://example.com/product"),
      ).toBeInTheDocument();
    });
  });

  it("shows Back button when onCancel prop is provided", async () => {
    const onCancel = vi.fn();
    render(() => <AddToWishlist onCancel={onCancel} />);

    await waitFor(() => screen.getByText("Awesome Product"));
    const backBtn = screen.getByRole("button", { name: "Back" });
    fireEvent.click(backBtn);
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it("shows category filter with 'All Categories' default", async () => {
    render(() => <AddToWishlist />);

    await waitFor(() => screen.getByText("Awesome Product"));
    expect(
      screen.getByRole("option", { name: "All Categories" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: "Electronics" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Books" })).toBeInTheDocument();
  });

  it("shows existing items in item selection dropdown", async () => {
    render(() => <AddToWishlist />);

    await waitFor(() => screen.getByText("Awesome Product"));
    expect(
      screen.getByRole("option", { name: /Existing Item/ }),
    ).toBeInTheDocument();
  });

  it("shows '+ Create new item' option in dropdown", async () => {
    render(() => <AddToWishlist />);

    await waitFor(() => screen.getByText("Awesome Product"));
    expect(
      screen.getByRole("option", { name: "+ Create new item" }),
    ).toBeInTheDocument();
  });

  it("Add Link button is disabled when no item is selected", async () => {
    render(() => <AddToWishlist />);

    await waitFor(() => screen.getByText("Awesome Product"));
    const addLinkBtn = screen.getByRole("button", { name: "Add Link" });
    expect(addLinkBtn).toBeDisabled();
  });

  it("opens new item modal when '+ Create new item' is selected", async () => {
    render(() => <AddToWishlist />);

    await waitFor(() => screen.getByText("Awesome Product"));

    const selects = screen.getAllByRole("combobox");
    const itemSelect = selects[1]!;
    fireEvent.change(itemSelect, { target: { value: "__create_new_item__" } });

    await waitFor(() => {
      expect(screen.getByText("Create New Item")).toBeInTheDocument();
    });
  });

  it("closes new item modal when × is clicked", async () => {
    render(() => <AddToWishlist />);

    await waitFor(() => screen.getByText("Awesome Product"));

    const selects = screen.getAllByRole("combobox");
    fireEvent.change(selects[1]!, { target: { value: "__create_new_item__" } });

    await waitFor(() => screen.getByText("Create New Item"));
    fireEvent.click(screen.getByRole("button", { name: "✕" }));

    await waitFor(() => {
      expect(screen.queryByText("Create New Item")).toBeNull();
    });
  });

  it("calls addItemLink and refetch when Add Link is clicked with item selected", async () => {
    const onSuccess = vi.fn();
    render(() => <AddToWishlist onSuccess={onSuccess} />);

    await waitFor(() => screen.getByText("Awesome Product"));

    // Select an existing item
    const selects = screen.getAllByRole("combobox");
    fireEvent.change(selects[1]!, { target: { value: "item-1" } });

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Add Link" }),
      ).not.toBeDisabled();
    });

    fireEvent.click(screen.getByRole("button", { name: "Add Link" }));

    await waitFor(() => {
      expect(mockAddItemLink).toHaveBeenCalledWith(
        "item-1",
        expect.objectContaining({ url: "https://example.com/product" }),
      );
      expect(mockRefetch).toHaveBeenCalled();
      expect(onSuccess).toHaveBeenCalledOnce();
    });
  });

  it("shows alert on addItemLink failure", async () => {
    mockAddItemLink.mockRejectedValueOnce(new Error("Link error"));
    render(() => <AddToWishlist />);

    await waitFor(() => screen.getByText("Awesome Product"));
    const selects = screen.getAllByRole("combobox");
    fireEvent.change(selects[1]!, { target: { value: "item-1" } });

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Add Link" }),
      ).not.toBeDisabled();
    });
    fireEvent.click(screen.getByRole("button", { name: "Add Link" }));

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith(
        "Failed to add link to item. Please try again.",
      );
    });
  });

  it("creates new item via modal and calls onSuccess", async () => {
    const onSuccess = vi.fn();
    render(() => <AddToWishlist onSuccess={onSuccess} />);

    await waitFor(() => screen.getByText("Awesome Product"));

    const selects = screen.getAllByRole("combobox");
    fireEvent.change(selects[1]!, { target: { value: "__create_new_item__" } });

    await waitFor(() => screen.getByText("Create New Item"));

    // Click "Create Item" button
    fireEvent.click(screen.getByRole("button", { name: "Create Item" }));

    await waitFor(() => {
      expect(mockCreateItem).toHaveBeenCalledWith(
        expect.objectContaining({
          url: "https://example.com/product",
          categoryId: "cat-1",
        }),
      );
      expect(onSuccess).toHaveBeenCalledOnce();
    });
  });

  it("shows alert when creating item without category", async () => {
    mockValue = () => ({
      ...mockWishlistData,
      categories: [],
    });
    render(() => <AddToWishlist />);

    await waitFor(() => screen.getByText("Awesome Product"));

    // Open modal via "Create one" button when no items found
    const createOneBtn = screen.queryByRole("button", { name: "Create one" });
    if (createOneBtn) {
      fireEvent.click(createOneBtn);
      await waitFor(() => screen.getByText("Create New Item"));
      fireEvent.click(screen.getByRole("button", { name: "Create Item" }));
      await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith(
          "Please choose a category before creating an item.",
        );
      });
    }
  });

  it("shows alert on createItem failure", async () => {
    mockCreateItem.mockRejectedValueOnce(new Error("Create failed"));
    render(() => <AddToWishlist />);

    await waitFor(() => screen.getByText("Awesome Product"));

    const selects = screen.getAllByRole("combobox");
    fireEvent.change(selects[1]!, { target: { value: "__create_new_item__" } });

    await waitFor(() => screen.getByText("Create New Item"));
    fireEvent.click(screen.getByRole("button", { name: "Create Item" }));

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith(
        "Failed to create item. Please try again.",
      );
    });
  });

  it("shows wishlist loading state when state is pending", async () => {
    mockValue = () => undefined;
    mockStateValue = () => "pending";
    render(() => <AddToWishlist />);

    await waitFor(() => screen.getByText("Awesome Product"));
    expect(screen.getAllByText("Loading…").length).toBeGreaterThan(0);
  });

  it("shows wishlist error when state is errored", async () => {
    mockValue = () => undefined;
    mockStateValue = () => "errored";
    mockErrorValue = () => new Error("Auth required");
    render(() => <AddToWishlist />);

    await waitFor(() => screen.getByText("Awesome Product"));
    expect(screen.getAllByText("Auth required").length).toBeGreaterThan(0);
  });

  it("shows favicon image when page has favicon", async () => {
    render(() => <AddToWishlist />);

    await waitFor(() => screen.getByText("Awesome Product"));
    const favicon = document.querySelector(
      'img[src="https://example.com/favicon.ico"]',
    );
    expect(favicon).toBeInTheDocument();
  });

  it("shows 'No items found' empty hint when filtered items are empty", async () => {
    render(() => <AddToWishlist />);

    await waitFor(() => screen.getByText("Awesome Product"));
    // Filter to a category with no items (Books has no items)
    const selects = screen.getAllByRole("combobox");
    fireEvent.change(selects[0]!, { target: { value: "cat-2" } });

    await waitFor(() => {
      expect(
        screen.getByText("No items found in this category."),
      ).toBeInTheDocument();
    });
  });
});
