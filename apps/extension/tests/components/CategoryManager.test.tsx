import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import {
  render,
  screen,
  fireEvent,
  cleanup,
  waitFor,
} from "@solidjs/testing-library";
import { CategoryManager } from "../../src/components/CategoryManager";
import type { GraphQLWishlistPayload } from "@repo/common/graphql/types";

const mockRefetch = vi.fn();
const mockCreateCategory = vi.fn();
const mockDeleteCategory = vi.fn();

const mockApi = {
  createCategory: mockCreateCategory,
  updateCategory: vi.fn(),
  deleteCategory: mockDeleteCategory,
  createItem: vi.fn(),
  updateItem: vi.fn(),
  deleteItem: vi.fn(),
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
      color: "#ff0000",
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
      title: "Laptop",
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
    {
      id: "item-2",
      title: "Novel",
      description: null,
      categoryId: "cat-2",
      favicon: null,
      status: "WANT",
      priority: 0,
      userId: "user-1",
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-01T00:00:00Z",
      links: [],
    },
    {
      id: "item-3",
      title: "Phone",
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
    totalItems: 3,
    page: 1,
    pageSize: 5,
    totalPages: 1,
    hasNext: false,
    hasPrevious: false,
  },
};

let mockValue = () => mockWishlistData as GraphQLWishlistPayload | undefined;
let mockState = () => "ready" as ReturnType<() => string>;
let mockError = () => undefined as unknown;

vi.mock("../../src/lib/wishlist/context", () => ({
  useWishlistData: () => ({
    value: () => mockValue(),
    state: () => mockState(),
    error: () => mockError(),
    refetch: mockRefetch,
    api: mockApi,
    page: () => 1,
    setPage: vi.fn(),
    pageSize: 5,
    categoryId: () => null,
    setCategoryId: vi.fn(),
  }),
}));

beforeEach(() => {
  mockValue = () => mockWishlistData;
  mockState = () => "ready";
  mockError = () => undefined;
  mockRefetch.mockReset().mockResolvedValue(undefined);
  mockCreateCategory
    .mockReset()
    .mockResolvedValue({ id: "cat-new", name: "New" });
  mockDeleteCategory.mockReset().mockResolvedValue(undefined);
  vi.spyOn(window, "alert").mockImplementation(() => {});
});

afterEach(() => cleanup());

describe("CategoryManager", () => {
  it("renders Manage Categories heading", () => {
    render(() => <CategoryManager />);
    expect(screen.getByText("Manage Categories")).toBeInTheDocument();
  });

  it("shows close button when onClose prop is provided", () => {
    const onClose = vi.fn();
    render(() => <CategoryManager onClose={onClose} />);
    expect(screen.getByText("✕")).toBeInTheDocument();
  });

  it("calls onClose when close button is clicked", () => {
    const onClose = vi.fn();
    render(() => <CategoryManager onClose={onClose} />);
    fireEvent.click(screen.getByText("✕"));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("does not show close button when onClose is not provided", () => {
    render(() => <CategoryManager />);
    expect(screen.queryByText("✕")).toBeNull();
  });

  it("shows category names from wishlist data", () => {
    render(() => <CategoryManager />);
    expect(screen.getByText("Electronics")).toBeInTheDocument();
    expect(screen.getByText("Books")).toBeInTheDocument();
  });

  it("shows item counts per category", () => {
    render(() => <CategoryManager />);
    // Electronics has 2 items, Books has 1 item
    expect(screen.getByText("2 items")).toBeInTheDocument();
    expect(screen.getByText("1 items")).toBeInTheDocument();
  });

  it("shows loading state when data is not available", () => {
    mockValue = () => undefined;
    mockState = () => "pending";
    render(() => <CategoryManager />);
    expect(screen.getByText("Loading…")).toBeInTheDocument();
  });

  it("shows error message when state is errored", () => {
    mockValue = () => undefined;
    mockState = () => "errored";
    mockError = () => new Error("Network error");
    render(() => <CategoryManager />);
    expect(screen.getByText("Network error")).toBeInTheDocument();
  });

  it("shows default error message when error is not an Error instance", () => {
    mockValue = () => undefined;
    mockState = () => "errored";
    mockError = () => "string error";
    render(() => <CategoryManager />);
    expect(
      screen.getByText("Unable to load categories. Please sign in."),
    ).toBeInTheDocument();
  });

  it("Add button is disabled when name input is empty", () => {
    render(() => <CategoryManager />);
    const addButton = screen.getByRole("button", { name: "Add" });
    expect(addButton).toBeDisabled();
  });

  it("Add button is enabled when name input has content", () => {
    render(() => <CategoryManager />);
    const input = screen.getByPlaceholderText("Category name...");
    fireEvent.input(input, { target: { value: "New Category" } });
    const addButton = screen.getByRole("button", { name: "Add" });
    expect(addButton).not.toBeDisabled();
  });

  it("Add button is disabled when state is errored", () => {
    mockState = () => "errored";
    render(() => <CategoryManager />);
    const input = screen.getByPlaceholderText("Category name...");
    fireEvent.input(input, { target: { value: "New Category" } });
    const addButton = screen.getByRole("button", { name: "Add" });
    expect(addButton).toBeDisabled();
  });

  it("calls createCategory and refetch when Add is clicked with a name", async () => {
    render(() => <CategoryManager />);
    const input = screen.getByPlaceholderText("Category name...");
    fireEvent.input(input, { target: { value: "New Category" } });
    fireEvent.click(screen.getByRole("button", { name: "Add" }));

    await waitFor(() => {
      expect(mockCreateCategory).toHaveBeenCalledWith(
        expect.objectContaining({ name: "New Category" }),
      );
      expect(mockRefetch).toHaveBeenCalled();
    });
  });

  it("clears the input after successful add", async () => {
    render(() => <CategoryManager />);
    const input = screen.getByPlaceholderText("Category name...");
    fireEvent.input(input, { target: { value: "New Category" } });
    fireEvent.click(screen.getByRole("button", { name: "Add" }));

    await waitFor(() => {
      expect((input as HTMLInputElement).value).toBe("");
    });
  });

  it("submits on Enter key press in input", async () => {
    render(() => <CategoryManager />);
    const input = screen.getByPlaceholderText("Category name...");
    fireEvent.input(input, { target: { value: "New Category" } });
    fireEvent.keyPress(input, { key: "Enter", code: "Enter", charCode: 13 });

    await waitFor(() => {
      expect(mockCreateCategory).toHaveBeenCalled();
    });
  });

  it("shows alert on createCategory error (Error instance)", async () => {
    mockCreateCategory.mockRejectedValueOnce(new Error("Already exists"));
    render(() => <CategoryManager />);
    const input = screen.getByPlaceholderText("Category name...");
    fireEvent.input(input, { target: { value: "Dup" } });
    fireEvent.click(screen.getByRole("button", { name: "Add" }));

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith("Already exists");
    });
  });

  it("shows generic alert on createCategory error (non-Error)", async () => {
    mockCreateCategory.mockRejectedValueOnce("unknown error");
    render(() => <CategoryManager />);
    const input = screen.getByPlaceholderText("Category name...");
    fireEvent.input(input, { target: { value: "Dup" } });
    fireEvent.click(screen.getByRole("button", { name: "Add" }));

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith("Failed to add category");
    });
  });

  it("shows Remove buttons for each category", () => {
    render(() => <CategoryManager />);
    const removeButtons = screen.getAllByRole("button", { name: "Remove" });
    expect(removeButtons).toHaveLength(2);
  });

  it("opens delete confirm dialog when Remove is clicked", async () => {
    render(() => <CategoryManager />);
    const removeButtons = screen.getAllByRole("button", { name: "Remove" });
    fireEvent.click(removeButtons[0]!);

    await waitFor(() => {
      expect(screen.getByText(/Delete Category/)).toBeInTheDocument();
    });
  });

  it("calls deleteCategory and refetch on confirm delete", async () => {
    render(() => <CategoryManager />);
    const removeButtons = screen.getAllByRole("button", { name: "Remove" });
    fireEvent.click(removeButtons[0]!);

    await waitFor(() => screen.getByText(/Delete Category/));

    const confirmBtn = screen.getByRole("button", { name: "Delete" });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(mockDeleteCategory).toHaveBeenCalledWith("cat-1");
      expect(mockRefetch).toHaveBeenCalled();
    });
  });

  it("closes confirm dialog on cancel", async () => {
    render(() => <CategoryManager />);
    const removeButtons = screen.getAllByRole("button", { name: "Remove" });
    fireEvent.click(removeButtons[0]!);

    await waitFor(() => screen.getByText(/Delete Category/));

    const cancelBtn = screen.getByRole("button", { name: "Cancel" });
    fireEvent.click(cancelBtn);

    await waitFor(() => {
      expect(screen.queryByText(/Delete Category/)).toBeNull();
    });
  });

  it("shows alert on deleteCategory error", async () => {
    mockDeleteCategory.mockRejectedValueOnce(new Error("Cannot delete"));
    render(() => <CategoryManager />);
    const removeButtons = screen.getAllByRole("button", { name: "Remove" });
    fireEvent.click(removeButtons[0]!);

    await waitFor(() => screen.getByText(/Delete Category/));
    const confirmBtn = screen.getByRole("button", { name: "Delete" });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith("Cannot delete");
    });
  });
});
