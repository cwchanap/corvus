import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@solidjs/testing-library";
import { Show } from "solid-js";
import { WishlistDashboard } from "./WishlistDashboard";
import type {
  WishlistCategoryRecord,
  WishlistItemRecord,
} from "@repo/common/types/wishlist-record";

// Mock all the hooks and dependencies
vi.mock("../lib/theme/context", () => ({
  useTheme: () => ({
    theme: () => "light",
    setTheme: vi.fn(),
    resolvedTheme: () => "light",
  }),
}));

vi.mock("@solidjs/router", () => ({
  A: (props: { children: unknown; href: string }) => (
    <a href={props.href}>{props.children}</a>
  ),
  useNavigate: () => vi.fn(),
}));

// Mock GraphQL hooks - using factory pattern for test isolation
const createMockWishlistQuery = () => ({
  data: undefined as unknown,
  isLoading: false,
  isFetching: false,
  isError: false,
  error: null as unknown,
  refetch: vi.fn(),
});

const createMockMutation = () => ({
  mutateAsync: vi.fn(),
  isPending: false,
});

// Create initial mock objects - these will be mutated in beforeEach
// Note: vi.mock() creates a closure, so we must mutate these objects
// rather than reassigning them to maintain test isolation
const mockWishlistQuery = createMockWishlistQuery();
const mockDeleteItem = createMockMutation();
const mockCreateItem = createMockMutation();
const mockUpdateItem = createMockMutation();
const mockAddItemLink = createMockMutation();
const mockUpdateItemLink = createMockMutation();
const mockDeleteItemLink = createMockMutation();
const mockBatchDeleteItems = createMockMutation();
const mockBatchMoveItems = createMockMutation();
const mockLogout = createMockMutation();

vi.mock("../lib/graphql/hooks/use-wishlist", () => ({
  useWishlist: () => mockWishlistQuery,
  useDeleteItem: () => mockDeleteItem,
  useCreateItem: () => mockCreateItem,
  useUpdateItem: () => mockUpdateItem,
  useAddItemLink: () => mockAddItemLink,
  useUpdateItemLink: () => mockUpdateItemLink,
  useDeleteItemLink: () => mockDeleteItemLink,
  useBatchDeleteItems: () => mockBatchDeleteItems,
  useBatchMoveItems: () => mockBatchMoveItems,
}));

vi.mock("../lib/graphql/hooks/use-auth", () => ({
  useLogout: () => mockLogout,
}));

vi.mock("../lib/graphql/adapters", () => ({
  adaptWishlistData: (data: unknown) => data,
}));

// Mock dialog components
vi.mock("./AddItemDialog", () => ({
  AddItemDialog: (props: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (payload: unknown) => Promise<void> | void;
    categories: unknown[];
    initialCategoryId?: string | null;
    submitting?: boolean;
  }) => (
    <Show when={props.open}>
      <div data-testid="add-item-dialog">Add Item Dialog</div>
    </Show>
  ),
}));

vi.mock("./EditItemDialog", () => ({
  EditItemDialog: (props: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (payload: unknown) => Promise<void> | void;
    categories: unknown[];
    item: unknown;
    submitting?: boolean;
  }) => (
    <Show when={props.open}>
      <div data-testid="edit-item-dialog">Edit Item Dialog</div>
    </Show>
  ),
}));

vi.mock("./ViewItemDialog", () => ({
  ViewItemDialog: (props: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    item: unknown;
    categories: unknown[];
  }) => (
    <Show when={props.open}>
      <div data-testid="view-item-dialog">View Item Dialog</div>
    </Show>
  ),
}));

vi.mock("./CategoryManager", () => ({
  CategoryManager: (props: {
    categories: unknown[];
    onRefetch: () => Promise<void>;
    onClose?: () => void;
  }) => (
    <div data-testid="category-manager">
      Category Manager
      <button onClick={() => props.onClose?.()}>Close</button>
    </div>
  ),
}));

vi.mock("./WishlistFilters", () => ({
  WishlistFilters: (props: {
    categoryName: string;
    searchQuery: () => string;
    setSearchQuery: (value: string) => void;
    sortBy: () => "date" | "title" | "custom";
    setSortBy: (value: "date" | "title" | "custom") => void;
    onAddItem: () => void;
    isSelectionMode?: () => boolean;
    onToggleSelectionMode?: () => void;
    hasItems?: boolean;
  }) => (
    <div data-testid="wishlist-filters">
      <h2>{props.categoryName}</h2>
      {props.onToggleSelectionMode &&
      (props.hasItems || props.isSelectionMode?.()) ? (
        <button onClick={() => props.onToggleSelectionMode?.()}>
          {props.isSelectionMode?.() ? "Cancel" : "Select"}
        </button>
      ) : null}
      <button onClick={() => props.onAddItem()}>Add Item</button>
    </div>
  ),
}));

describe("WishlistDashboard", () => {
  const mockUser = {
    id: "user-1",
    name: "John Doe",
    email: "john@example.com",
  };

  const mockCategory: WishlistCategoryRecord = {
    id: "cat-1",
    name: "Electronics",
    color: "#6366f1",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    user_id: 1,
  };

  const mockItem: WishlistItemRecord = {
    id: "item-1",
    title: "Laptop",
    description: "Gaming laptop",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    user_id: 1,
    category_id: "cat-1",
    links: [],
  };

  // Helper function to create mock wishlist data with overrides
  const createMockWishlistData = (overrides?: {
    items?: WishlistItemRecord[];
    categories?: WishlistCategoryRecord[];
    pagination?: Partial<{
      page: number;
      page_size: number;
      total_items: number;
      total_pages: number;
      has_next: boolean;
      has_previous: boolean;
    }>;
  }) => ({
    items: overrides?.items ?? [],
    categories: overrides?.categories ?? [],
    pagination: {
      page: 1,
      page_size: 10,
      total_items: 0,
      total_pages: 0,
      has_next: false,
      has_previous: false,
      ...overrides?.pagination,
    },
  });

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mock properties to default values for test isolation
    // Using Object.assign() to mutate the original objects (not reassign)
    // because vi.mock() creates closures that capture the original references
    Object.assign(mockWishlistQuery, createMockWishlistQuery());
    Object.assign(mockDeleteItem, createMockMutation());
    Object.assign(mockCreateItem, createMockMutation());
    Object.assign(mockUpdateItem, createMockMutation());
    Object.assign(mockAddItemLink, createMockMutation());
    Object.assign(mockUpdateItemLink, createMockMutation());
    Object.assign(mockDeleteItemLink, createMockMutation());
    Object.assign(mockBatchDeleteItems, createMockMutation());
    Object.assign(mockBatchMoveItems, createMockMutation());
    Object.assign(mockLogout, createMockMutation());
  });

  describe("Rendering", () => {
    it("should render header with user name", () => {
      render(() => <WishlistDashboard user={mockUser} />);
      expect(screen.getByText("Corvus Wishlist")).toBeInTheDocument();
      expect(screen.getByText(/Welcome back, John Doe!/)).toBeInTheDocument();
    });

    it("should render Profile link", () => {
      render(() => <WishlistDashboard user={mockUser} />);
      expect(screen.getByText("Profile")).toBeInTheDocument();
    });

    it("should render Sign Out button", () => {
      render(() => <WishlistDashboard user={mockUser} />);
      expect(screen.getByText("Sign Out")).toBeInTheDocument();
    });

    it("should render Categories section", () => {
      render(() => <WishlistDashboard user={mockUser} />);
      expect(screen.getByText("Categories")).toBeInTheDocument();
      expect(screen.getByText("Organize your wishlist")).toBeInTheDocument();
    });
  });

  describe("Loading State", () => {
    it("should show loading indicator when data is loading", () => {
      mockWishlistQuery.isLoading = true;
      mockWishlistQuery.data = undefined;

      render(() => <WishlistDashboard user={mockUser} />);
      expect(screen.getByText("Loading your wishlist...")).toBeInTheDocument();
    });

    it("should show updating indicator when fetching", () => {
      mockWishlistQuery.isLoading = false;
      mockWishlistQuery.isFetching = true;
      mockWishlistQuery.data = createMockWishlistData();

      render(() => <WishlistDashboard user={mockUser} />);
      expect(screen.getByText("Updating...")).toBeInTheDocument();
    });
  });

  describe("Error State", () => {
    it("should show error message when query fails", () => {
      mockWishlistQuery.isError = true;
      mockWishlistQuery.error = { message: "Network error" };

      render(() => <WishlistDashboard user={mockUser} />);
      expect(screen.getByText(/Error loading wishlist:/)).toBeInTheDocument();
      expect(screen.getByText(/Network error/)).toBeInTheDocument();
    });

    it("should show unknown error when no error message", () => {
      mockWishlistQuery.isError = true;
      mockWishlistQuery.error = {};

      render(() => <WishlistDashboard user={mockUser} />);
      expect(screen.getByText(/Unknown error/)).toBeInTheDocument();
    });
  });

  describe("Empty State", () => {
    it("should show empty message when no items", () => {
      mockWishlistQuery.data = createMockWishlistData();

      render(() => <WishlistDashboard user={mockUser} />);
      expect(
        screen.getByText(/No items in this category yet/),
      ).toBeInTheDocument();
    });
  });

  describe("Categories", () => {
    it("should display All Items category by default", () => {
      mockWishlistQuery.data = createMockWishlistData({
        items: [mockItem],
        pagination: { total_items: 1, total_pages: 1 },
      });

      render(() => <WishlistDashboard user={mockUser} />);
      expect(screen.getByText(/All Items \(1\)/)).toBeInTheDocument();
    });

    it("should display categories when available", () => {
      mockWishlistQuery.data = createMockWishlistData({
        categories: [mockCategory],
      });

      render(() => <WishlistDashboard user={mockUser} />);
      expect(screen.getByText("Electronics")).toBeInTheDocument();
    });

    it("should open category manager when settings button clicked", async () => {
      mockWishlistQuery.data = createMockWishlistData();

      render(() => <WishlistDashboard user={mockUser} />);

      const settingsButton = screen.getByTitle("Manage Categories");
      fireEvent.click(settingsButton);

      await waitFor(() => {
        expect(screen.getByTestId("category-manager")).toBeInTheDocument();
      });
    });
  });

  describe("Items Display", () => {
    it("should display wishlist items", () => {
      mockWishlistQuery.data = createMockWishlistData({
        items: [mockItem],
        categories: [mockCategory],
        pagination: { total_items: 1, total_pages: 1 },
      });

      render(() => <WishlistDashboard user={mockUser} />);
      expect(screen.getByText("Laptop")).toBeInTheDocument();
      expect(screen.getByText("Gaming laptop")).toBeInTheDocument();
    });

    it("should display multiple items", () => {
      const items: WishlistItemRecord[] = [
        { ...mockItem, id: "item-1", title: "Laptop" },
        { ...mockItem, id: "item-2", title: "Mouse" },
        { ...mockItem, id: "item-3", title: "Keyboard" },
      ];

      mockWishlistQuery.data = createMockWishlistData({
        items,
        pagination: { total_items: 3, total_pages: 1 },
      });

      render(() => <WishlistDashboard user={mockUser} />);
      expect(screen.getByText("Laptop")).toBeInTheDocument();
      expect(screen.getByText("Mouse")).toBeInTheDocument();
      expect(screen.getByText("Keyboard")).toBeInTheDocument();
    });

    it("should show link count for items", () => {
      const itemWithLinks: WishlistItemRecord = {
        ...mockItem,
        links: [
          {
            id: "link-1",
            url: "https://example.com",
            description: "Example",
            is_primary: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            item_id: "item-1",
          },
        ],
      };

      mockWishlistQuery.data = createMockWishlistData({
        items: [itemWithLinks],
        pagination: { total_items: 1, total_pages: 1 },
      });

      render(() => <WishlistDashboard user={mockUser} />);
      expect(screen.getByText("1 link")).toBeInTheDocument();
    });
  });

  describe("Pagination", () => {
    it("should show pagination controls", () => {
      mockWishlistQuery.data = createMockWishlistData({
        items: [mockItem],
        pagination: {
          total_items: 20,
          total_pages: 2,
          has_next: true,
        },
      });

      render(() => <WishlistDashboard user={mockUser} />);
      expect(screen.getByText("Previous")).toBeInTheDocument();
      expect(screen.getByText("Next")).toBeInTheDocument();
      expect(screen.getByText(/Page 1 of 2/)).toBeInTheDocument();
    });

    it("should disable Previous button on first page", () => {
      mockWishlistQuery.data = createMockWishlistData({
        items: [mockItem],
        pagination: {
          total_items: 20,
          total_pages: 2,
          has_next: true,
        },
      });

      render(() => <WishlistDashboard user={mockUser} />);
      const previousButton = screen.getByText("Previous").closest("button");
      expect(previousButton).toBeDisabled();
    });

    it("should disable Next button on last page", () => {
      mockWishlistQuery.data = createMockWishlistData({
        items: [mockItem],
        pagination: {
          page: 2,
          total_items: 20,
          total_pages: 2,
          has_previous: true,
        },
      });

      render(() => <WishlistDashboard user={mockUser} />);
      const nextButton = screen.getByText("Next").closest("button");
      expect(nextButton).toBeDisabled();
    });

    it("should show correct item range", () => {
      mockWishlistQuery.data = createMockWishlistData({
        items: [mockItem],
        pagination: {
          total_items: 25,
          total_pages: 3,
          has_next: true,
        },
      });

      render(() => <WishlistDashboard user={mockUser} />);
      expect(screen.getByText(/Showing 1–1 of 25 items/)).toBeInTheDocument();
    });
  });

  describe("Item Actions", () => {
    beforeEach(() => {
      mockWishlistQuery.data = createMockWishlistData({
        items: [mockItem],
        pagination: { total_items: 1, total_pages: 1 },
      });
    });

    it("should show edit button for each item", () => {
      render(() => <WishlistDashboard user={mockUser} />);
      const editButton = screen.getByTitle("Edit item");
      expect(editButton).toBeInTheDocument();
    });

    it("should show delete button for each item", () => {
      render(() => <WishlistDashboard user={mockUser} />);
      const deleteButton = screen.getByTitle("Delete item");
      expect(deleteButton).toBeInTheDocument();
    });

    it("should open view dialog when item is clicked", async () => {
      render(() => <WishlistDashboard user={mockUser} />);

      const itemButton = screen.getByText("Laptop").closest("button");
      fireEvent.click(itemButton!);

      await waitFor(() => {
        expect(screen.getByTestId("view-item-dialog")).toBeInTheDocument();
      });
    });

    it("should open edit dialog when edit button is clicked", async () => {
      render(() => <WishlistDashboard user={mockUser} />);

      const editButton = screen.getByTitle("Edit item");
      fireEvent.click(editButton);

      await waitFor(() => {
        expect(screen.getByTestId("edit-item-dialog")).toBeInTheDocument();
      });
    });
  });

  describe("Dialogs", () => {
    beforeEach(() => {
      mockWishlistQuery.data = createMockWishlistData();
    });

    it("should not show dialogs by default", () => {
      render(() => <WishlistDashboard user={mockUser} />);
      expect(screen.queryByTestId("add-item-dialog")).not.toBeInTheDocument();
      expect(screen.queryByTestId("edit-item-dialog")).not.toBeInTheDocument();
      expect(screen.queryByTestId("view-item-dialog")).not.toBeInTheDocument();
    });

    it("should open add item dialog when Add Item button is clicked", async () => {
      render(() => <WishlistDashboard user={mockUser} />);

      // Click the Add Item button from the mocked WishlistFilters
      const addButton = screen.getByText("Add Item");
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(screen.getByTestId("add-item-dialog")).toBeInTheDocument();
      });
    });
  });

  describe("User Actions", () => {
    it("should have functional Sign Out button", () => {
      render(() => <WishlistDashboard user={mockUser} />);
      const signOutButton = screen.getByText("Sign Out");
      expect(signOutButton).toBeInTheDocument();
      fireEvent.click(signOutButton);
      expect(mockLogout.mutateAsync).toHaveBeenCalled();
    });
  });

  describe("Bulk Operations", () => {
    const items: WishlistItemRecord[] = [
      { ...mockItem, id: "item-1", title: "Laptop" },
      { ...mockItem, id: "item-2", title: "Mouse" },
      { ...mockItem, id: "item-3", title: "Keyboard" },
    ];

    const targetCategory: WishlistCategoryRecord = {
      ...mockCategory,
      id: "cat-2",
      name: "Books",
    };

    const renderWithItems = () => {
      mockWishlistQuery.data = createMockWishlistData({
        items,
        categories: [mockCategory, targetCategory],
        pagination: { total_items: items.length, total_pages: 1 },
      });

      render(() => <WishlistDashboard user={mockUser} />);
    };

    const enterSelectionMode = () => {
      const selectButton = screen.getByText("Select");
      fireEvent.click(selectButton);
    };

    const selectItems = (titles: string[]) => {
      for (const title of titles) {
        const checkbox = screen.getByLabelText(`Select ${title}`);
        fireEvent.click(checkbox);
      }
    };

    it("should batch delete selected items via BulkActionBar", async () => {
      mockBatchDeleteItems.mutateAsync.mockResolvedValueOnce(undefined);
      renderWithItems();

      enterSelectionMode();
      selectItems(["Laptop", "Mouse"]);

      expect(screen.getByText("items selected")).toBeInTheDocument();
      fireEvent.click(screen.getByText("Delete Selected"));

      // Confirm dialog
      await waitFor(() => {
        expect(screen.getByText("Delete Selected Items")).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText("Delete"));

      await waitFor(() => {
        expect(mockBatchDeleteItems.mutateAsync).toHaveBeenCalledWith([
          "item-1",
          "item-2",
        ]);
      });

      // Success exits selection mode
      await waitFor(() => {
        expect(screen.queryByText("Delete Selected")).not.toBeInTheDocument();
        expect(
          screen.queryByLabelText("Select Laptop"),
        ).not.toBeInTheDocument();
      });
    });

    it("should batch move selected items via BulkActionBar", async () => {
      mockBatchMoveItems.mutateAsync.mockResolvedValueOnce(undefined);
      renderWithItems();

      enterSelectionMode();
      selectItems(["Laptop", "Mouse"]);

      fireEvent.click(screen.getByText("Move to..."));
      const moveDropdownContainer = screen
        .getByText("Move to...")
        .closest(".move-dropdown-container");
      expect(moveDropdownContainer).toBeTruthy();

      const moveButtons = Array.from(
        moveDropdownContainer!.querySelectorAll("button"),
      );
      const booksButton = moveButtons.find((btn) =>
        btn.textContent?.includes("Books"),
      );
      expect(booksButton).toBeTruthy();
      fireEvent.click(booksButton!);

      await waitFor(() => {
        expect(mockBatchMoveItems.mutateAsync).toHaveBeenCalledWith({
          itemIds: ["item-1", "item-2"],
          categoryId: "cat-2",
        });
      });

      await waitFor(() => {
        expect(screen.queryByText("Move to...")).not.toBeInTheDocument();
        expect(
          screen.queryByLabelText("Select Laptop"),
        ).not.toBeInTheDocument();
      });
    });

    it("should show an error message when batch delete fails", async () => {
      mockBatchDeleteItems.mutateAsync.mockRejectedValueOnce(
        new Error("Delete failed"),
      );
      renderWithItems();

      enterSelectionMode();
      selectItems(["Laptop", "Mouse"]);

      fireEvent.click(screen.getByText("Delete Selected"));
      fireEvent.click(await screen.findByText("Delete"));

      await waitFor(() => {
        expect(mockBatchDeleteItems.mutateAsync).toHaveBeenCalledWith([
          "item-1",
          "item-2",
        ]);
      });

      await waitFor(() => {
        expect(
          screen.getByText(/Bulk action failed: Delete failed/),
        ).toBeInTheDocument();
      });

      // On error, selection mode remains active
      expect(screen.getByText("Delete Selected")).toBeInTheDocument();
      expect(screen.getByLabelText("Select Laptop")).toBeInTheDocument();
    });

    it("should show isPending/loading UI for batch delete", async () => {
      mockBatchDeleteItems.isPending = true;
      renderWithItems();

      enterSelectionMode();
      selectItems(["Laptop", "Mouse"]);

      const deletingButton = screen.getByText("Deleting...").closest("button");
      expect(deletingButton).toBeDisabled();

      const moveButton = screen.getByText("Move to...").closest("button");
      expect(moveButton).toBeDisabled();

      const cancelButtons = screen.getAllByRole("button", { name: "Cancel" });
      const disabledCancel = cancelButtons.find((b) =>
        b.hasAttribute("disabled"),
      );
      expect(disabledCancel).toBeTruthy();

      const maybeSelectAllButtons = screen.getAllByRole("button");
      const selectAllButton = maybeSelectAllButtons.find(
        (b) =>
          (b.textContent || "").match(/Select All \(\d+\)|Deselect All/) &&
          b.hasAttribute("disabled"),
      );
      expect(selectAllButton).toBeTruthy();
    });

    it("should disable BulkActionBar actions when batch move is pending", async () => {
      mockBatchMoveItems.isPending = true;
      renderWithItems();

      enterSelectionMode();
      selectItems(["Laptop", "Mouse"]);

      const moveButton = screen.getByText("Move to...").closest("button");
      expect(moveButton).toBeDisabled();

      const deletingButton = screen.getByText("Deleting...").closest("button");
      expect(deletingButton).toBeDisabled();
    });
  });

  describe("Edge Cases", () => {
    it("should handle user with long name", () => {
      const longNameUser = {
        ...mockUser,
        name: "A".repeat(100),
      };

      render(() => <WishlistDashboard user={longNameUser} />);
      expect(screen.getByText(/Welcome back/)).toBeInTheDocument();
    });

    it("should handle empty categories array", () => {
      mockWishlistQuery.data = createMockWishlistData();

      render(() => <WishlistDashboard user={mockUser} />);
      const allItemsElements = screen.getAllByText(/All Items/);
      expect(allItemsElements.length).toBeGreaterThan(0);
    });
  });

  describe("Accessibility", () => {
    it("should render semantic header element", () => {
      const { container } = render(() => <WishlistDashboard user={mockUser} />);
      const header = container.querySelector("header");
      expect(header).toBeInTheDocument();
    });

    it("should have proper button roles", () => {
      mockWishlistQuery.data = createMockWishlistData();

      const { container } = render(() => <WishlistDashboard user={mockUser} />);
      const buttons = container.querySelectorAll("button");
      expect(buttons.length).toBeGreaterThan(0);
    });
  });
});
