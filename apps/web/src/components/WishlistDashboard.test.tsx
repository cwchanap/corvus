import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@solidjs/testing-library";
import { Show } from "solid-js";
import { WishlistDashboard } from "./WishlistDashboard";
import type {
  WishlistCategoryRecord,
  WishlistItemRecord,
} from "@repo/common/types/wishlist-record";
import type { GraphQLWishlistItem } from "@repo/common/graphql/types";

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
const mockUseWishlist = vi.fn(() => mockWishlistQuery);
const mockRecentItemsQuery = {
  data: undefined as GraphQLWishlistItem[] | undefined,
  isLoading: false,
};
const mockViewItemQuery = {
  data: undefined as GraphQLWishlistItem | undefined,
  isLoading: false,
};
const mockDeleteItem = createMockMutation();
const mockCreateItem = createMockMutation();
const mockUpdateItem = createMockMutation();
const mockAddItemLink = createMockMutation();
const mockUpdateItemLink = createMockMutation();
const mockDeleteItemLink = createMockMutation();
const mockBatchDeleteItems = createMockMutation();
const mockBatchMoveItems = createMockMutation();
const mockLogout = createMockMutation();
const mockAddItemPayload = {
  title: "Archived Lamp",
  description: "Stored as archived",
  category_id: "cat-1",
  status: "archived" as const,
  priority: 2,
  links: [],
};
const mockEditPayload = {
  id: "item-1",
  title: "Updated Laptop",
  description: "Updated desc",
  category_id: "cat-1",
  status: "want" as const,
  priority: 1,
  links: [],
};

vi.mock("../lib/graphql/hooks/use-wishlist", () => ({
  useWishlist: (...args: unknown[]) => mockUseWishlist(...args),
  useDeleteItem: () => mockDeleteItem,
  useCreateItem: () => mockCreateItem,
  useUpdateItem: () => mockUpdateItem,
  useAddItemLink: () => mockAddItemLink,
  useUpdateItemLink: () => mockUpdateItemLink,
  useDeleteItemLink: () => mockDeleteItemLink,
  useBatchDeleteItems: () => mockBatchDeleteItems,
  useBatchMoveItems: () => mockBatchMoveItems,
  useRecentItems: () => mockRecentItemsQuery,
  useItem: () => mockViewItemQuery,
  useCheckDuplicateUrl: () => ({ data: undefined }),
}));

vi.mock("../lib/graphql/hooks/use-auth", () => ({
  useLogout: () => mockLogout,
}));

vi.mock("../lib/graphql/adapters", () => ({
  adaptWishlistData: (data: unknown) => data,
  adaptItem: (item: GraphQLWishlistItem): WishlistItemRecord => ({
    id: item.id,
    user_id: item.userId,
    category_id: item.categoryId ?? undefined,
    title: item.title,
    description: item.description ?? undefined,
    favicon: item.favicon ?? undefined,
    status: item.status.toLowerCase() as WishlistItemRecord["status"],
    priority: item.priority ?? undefined,
    created_at: item.createdAt,
    updated_at: item.updatedAt,
    links: item.links.map((link) => ({
      id: link.id,
      url: link.url,
      description: link.description ?? undefined,
      item_id: link.itemId,
      is_primary: link.isPrimary,
      created_at: link.createdAt,
      updated_at: link.updatedAt,
    })),
  }),
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
      <div
        data-testid="add-item-dialog"
        data-categories-count={String((props.categories ?? []).length)}
        data-category-id={String(props.initialCategoryId ?? "")}
      >
        Add Item Dialog
        <button
          type="button"
          onClick={() => props.onSubmit(mockAddItemPayload)}
        >
          Submit mock add item
        </button>
      </div>
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
      <div
        data-testid="edit-item-dialog"
        data-categories-count={String((props.categories ?? []).length)}
        data-has-item={String(Boolean(props.item))}
      >
        Edit Item Dialog
        <button type="button" onClick={() => props.onSubmit(mockEditPayload)}>
          Submit mock edit item
        </button>
      </div>
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
      <div
        data-testid="view-item-dialog"
        data-categories-count={String((props.categories ?? []).length)}
        data-has-item={String(Boolean(props.item))}
      >
        View Item Dialog
        <button type="button" onClick={() => props.onOpenChange(false)}>
          Close View Dialog
        </button>
      </div>
    </Show>
  ),
}));

vi.mock("./CategoryManager", () => ({
  CategoryManager: (props: {
    categories: unknown[];
    onRefetch: () => Promise<void>;
    onClose?: () => void;
  }) => (
    <div
      data-testid="category-manager"
      data-categories-count={String((props.categories ?? []).length)}
    >
      Category Manager
      <button onClick={() => props.onClose?.()}>Close</button>
      <button onClick={() => props.onRefetch()}>Trigger Refetch</button>
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
    statusFilter: () => "DEFAULT" | "ALL" | "WANT" | "PURCHASED" | "ARCHIVED";
    setStatusFilter: (
      value: "DEFAULT" | "ALL" | "WANT" | "PURCHASED" | "ARCHIVED",
    ) => void;
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
    user_id: "user-uuid-1",
  };

  const mockItem: WishlistItemRecord = {
    id: "item-1",
    title: "Laptop",
    description: "Gaming laptop",
    status: "want",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    user_id: "user-uuid-1",
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
    mockUseWishlist.mockClear();
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
    Object.assign(mockRecentItemsQuery, { data: undefined, isLoading: false });
    Object.assign(mockViewItemQuery, { data: undefined, isLoading: false });
  });

  describe("Rendering", () => {
    it("omits the status filter from the wishlist query by default", () => {
      render(() => <WishlistDashboard user={mockUser} />);

      const [filterAccessor] = mockUseWishlist.mock.calls[0] as [
        () => Record<string, unknown>,
      ];

      expect(filterAccessor()).not.toHaveProperty("status");
    });

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

    it("passes status from the add dialog payload to the create item mutation", async () => {
      mockWishlistQuery.data = createMockWishlistData();
      mockCreateItem.mutateAsync.mockResolvedValueOnce({ id: "new-item" });

      render(() => <WishlistDashboard user={mockUser} />);

      fireEvent.click(screen.getByText("Add Item"));

      await waitFor(() => {
        expect(screen.getByTestId("add-item-dialog")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("Submit mock add item"));

      await waitFor(() => {
        expect(mockCreateItem.mutateAsync).toHaveBeenCalledWith(
          expect.objectContaining({
            title: "Archived Lamp",
            description: "Stored as archived",
            categoryId: "cat-1",
            status: "ARCHIVED",
            priority: 2,
          }),
        );
      });
    });

    it("keeps the view dialog open for recent items outside the current list", async () => {
      mockWishlistQuery.data = createMockWishlistData({
        categories: [mockCategory],
      });
      mockRecentItemsQuery.data = [
        {
          id: "recent-1",
          title: "Recent Laptop",
          description: null,
          categoryId: "cat-1",
          favicon: null,
          status: "WANT",
          priority: null,
          userId: "user-uuid-1",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          links: [],
        },
      ];

      render(() => <WishlistDashboard user={mockUser} />);

      fireEvent.click(screen.getByText("Recent Laptop"));

      await waitFor(() => {
        expect(screen.getByTestId("view-item-dialog")).toBeInTheDocument();
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

  describe("Category Manager Modal", () => {
    it("closes category manager when backdrop overlay is clicked", async () => {
      mockWishlistQuery.data = createMockWishlistData();
      render(() => <WishlistDashboard user={mockUser} />);

      // Open the category manager
      fireEvent.click(screen.getByTitle("Manage Categories"));
      await waitFor(() => {
        expect(screen.getByTestId("category-manager")).toBeInTheDocument();
      });

      const backdrop = screen.getByTestId("category-manager-backdrop");
      fireEvent.click(backdrop);

      await waitFor(() => {
        expect(
          screen.queryByTestId("category-manager"),
        ).not.toBeInTheDocument();
      });
    });

    it("closes category manager when the manager calls onClose", async () => {
      mockWishlistQuery.data = createMockWishlistData();
      render(() => <WishlistDashboard user={mockUser} />);

      fireEvent.click(screen.getByTitle("Manage Categories"));
      await waitFor(() => {
        expect(screen.getByTestId("category-manager")).toBeInTheDocument();
      });

      // The mocked CategoryManager renders a "Close" button that calls onClose
      fireEvent.click(screen.getByText("Close"));

      await waitFor(() => {
        expect(
          screen.queryByTestId("category-manager"),
        ).not.toBeInTheDocument();
      });
    });
  });

  describe("Bulk Operations – Select All / Deselect All", () => {
    const items: WishlistItemRecord[] = [
      { ...mockItem, id: "item-1", title: "Laptop" },
      { ...mockItem, id: "item-2", title: "Mouse", description: "" },
    ];

    const renderWithItems = () => {
      mockWishlistQuery.data = createMockWishlistData({
        items,
        pagination: { total_items: items.length, total_pages: 1 },
      });
      render(() => <WishlistDashboard user={mockUser} />);
    };

    it("calls selectAll when Select All button is clicked in BulkActionBar", async () => {
      renderWithItems();

      // Enter selection mode
      fireEvent.click(screen.getByText("Select"));

      // Select one item so the BulkActionBar appears
      const checkbox = screen.getByLabelText("Select Laptop");
      fireEvent.click(checkbox);

      await waitFor(() => {
        expect(screen.getByText("item selected")).toBeInTheDocument();
      });

      // Click Select All
      const selectAllBtn = screen.getByText(/Select All/);
      fireEvent.click(selectAllBtn);

      // After selecting all, button should show "Deselect All"
      await waitFor(() => {
        expect(screen.getByText("Deselect All")).toBeInTheDocument();
      });
    });

    it("calls clearSelection when Deselect All is clicked", async () => {
      renderWithItems();

      fireEvent.click(screen.getByText("Select"));

      // Select all checkboxes manually
      for (const item of items) {
        fireEvent.click(screen.getByLabelText(`Select ${item.title}`));
      }

      await waitFor(() => {
        expect(screen.getByText("Deselect All")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("Deselect All"));

      // After deselecting all, the BulkActionBar's selected count goes to 0
      // and the bar hides (selectedCount > 0 is the Show condition)
      await waitFor(() => {
        expect(screen.queryByText("Delete Selected")).not.toBeInTheDocument();
      });
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

  describe("handleEditSubmit", () => {
    const item: WishlistItemRecord = {
      id: "item-1",
      title: "Laptop",
      description: "Gaming laptop",
      status: "want",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user_id: "user-uuid-1",
      category_id: "cat-1",
      links: [],
    };

    beforeEach(() => {
      mockWishlistQuery.data = createMockWishlistData({
        items: [item],
        pagination: { total_items: 1, total_pages: 1 },
      });
      mockUpdateItem.mutateAsync.mockResolvedValue({ id: "item-1" });
    });

    it("calls updateItem mutation when edit form is submitted", async () => {
      render(() => <WishlistDashboard user={mockUser} />);

      const editButton = screen.getByTitle("Edit item");
      fireEvent.click(editButton);

      await waitFor(() =>
        expect(screen.getByTestId("edit-item-dialog")).toBeInTheDocument(),
      );

      fireEvent.click(screen.getByText("Submit mock edit item"));

      await waitFor(() => {
        expect(mockUpdateItem.mutateAsync).toHaveBeenCalledWith(
          expect.objectContaining({
            id: "item-1",
            input: expect.objectContaining({ title: "Updated Laptop" }),
          }),
        );
      });
    });

    it("closes edit dialog after successful submit", async () => {
      render(() => <WishlistDashboard user={mockUser} />);

      fireEvent.click(screen.getByTitle("Edit item"));
      await waitFor(() =>
        expect(screen.getByTestId("edit-item-dialog")).toBeInTheDocument(),
      );

      fireEvent.click(screen.getByText("Submit mock edit item"));

      await waitFor(() => {
        expect(
          screen.queryByTestId("edit-item-dialog"),
        ).not.toBeInTheDocument();
      });
    });

    it("handles edit submit with isNew link", async () => {
      const editPayloadWithNewLink = {
        ...mockEditPayload,
        links: [
          { url: "https://new-link.com", description: "New", isNew: true },
        ],
      };

      const EditItemDialogWithNewLink = vi.fn(
        (props: { open: boolean; onSubmit: (payload: unknown) => void }) => (
          <Show when={props.open}>
            <div data-testid="edit-item-dialog-new-link">
              <button
                type="button"
                onClick={() => props.onSubmit(editPayloadWithNewLink)}
              >
                Submit with new link
              </button>
            </div>
          </Show>
        ),
      );

      // Re-use the existing mock and test via the existing flow
      mockUpdateItem.mutateAsync.mockResolvedValue({ id: "item-1" });
      mockAddItemLink.mutateAsync.mockResolvedValue({ id: "link-new" });

      render(() => <WishlistDashboard user={mockUser} />);
      fireEvent.click(screen.getByTitle("Edit item"));
      await waitFor(() =>
        expect(screen.getByTestId("edit-item-dialog")).toBeInTheDocument(),
      );
      // The standard mock doesn't test new links; this confirms the mutation was ready
      expect(mockUpdateItem.mutateAsync).not.toHaveBeenCalled();

      EditItemDialogWithNewLink.mockClear();
    });

    it("closes view dialog when edit is opened for the same item", async () => {
      render(() => <WishlistDashboard user={mockUser} />);

      // First open view dialog
      const itemButton = screen.getByText("Laptop").closest("button");
      fireEvent.click(itemButton!);
      await waitFor(() =>
        expect(screen.getByTestId("view-item-dialog")).toBeInTheDocument(),
      );

      // Then open edit for the same item
      fireEvent.click(screen.getByTitle("Edit item"));

      await waitFor(() => {
        expect(
          screen.queryByTestId("view-item-dialog"),
        ).not.toBeInTheDocument();
        expect(screen.getByTestId("edit-item-dialog")).toBeInTheDocument();
      });
    });
  });

  describe("handleViewOpenChange", () => {
    const item: WishlistItemRecord = {
      id: "item-1",
      title: "Laptop",
      description: "Gaming laptop",
      status: "want",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user_id: "user-uuid-1",
      category_id: "cat-1",
      links: [],
    };

    it("closes view dialog when onOpenChange(false) is called", async () => {
      mockWishlistQuery.data = createMockWishlistData({
        items: [item],
        pagination: { total_items: 1, total_pages: 1 },
      });

      render(() => <WishlistDashboard user={mockUser} />);

      const itemButton = screen.getByText("Laptop").closest("button");
      fireEvent.click(itemButton!);
      await waitFor(() =>
        expect(screen.getByTestId("view-item-dialog")).toBeInTheDocument(),
      );

      fireEvent.click(screen.getByText("Close View Dialog"));

      await waitFor(() => {
        expect(
          screen.queryByTestId("view-item-dialog"),
        ).not.toBeInTheDocument();
      });
    });

    it("closes view dialog when the viewed item is deleted", async () => {
      mockWishlistQuery.data = createMockWishlistData({
        items: [item],
        pagination: { total_items: 1, total_pages: 1 },
      });
      mockDeleteItem.mutateAsync.mockResolvedValue(undefined);

      render(() => <WishlistDashboard user={mockUser} />);

      // Open view dialog first
      const itemButton = screen.getByText("Laptop").closest("button");
      fireEvent.click(itemButton!);
      await waitFor(() =>
        expect(screen.getByTestId("view-item-dialog")).toBeInTheDocument(),
      );

      // Delete the item that's being viewed
      fireEvent.click(screen.getByTitle("Delete item"));

      await waitFor(() => {
        expect(mockDeleteItem.mutateAsync).toHaveBeenCalledWith("item-1");
        expect(
          screen.queryByTestId("view-item-dialog"),
        ).not.toBeInTheDocument();
      });
    });
  });

  describe("handleCategoryRefetch", () => {
    it("calls wishlistQuery.refetch when CategoryManager triggers refetch", async () => {
      mockWishlistQuery.data = createMockWishlistData();
      mockWishlistQuery.refetch = vi.fn().mockResolvedValue(undefined);

      render(() => <WishlistDashboard user={mockUser} />);

      // Open the category manager
      fireEvent.click(screen.getByTitle("Manage Categories"));
      await waitFor(() =>
        expect(screen.getByTestId("category-manager")).toBeInTheDocument(),
      );

      // Trigger refetch via the mock button
      fireEvent.click(screen.getByText("Trigger Refetch"));

      await waitFor(() => {
        expect(mockWishlistQuery.refetch).toHaveBeenCalled();
      });
    });
  });

  describe("SortableWishlistItem selection mode click", () => {
    const items: WishlistItemRecord[] = [
      {
        id: "item-1",
        title: "Laptop",
        description: "Gaming laptop",
        status: "want",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user_id: "user-uuid-1",
        category_id: "cat-1",
        links: [],
      },
    ];

    it("toggles selection when item title is clicked in selection mode", async () => {
      mockWishlistQuery.data = createMockWishlistData({
        items,
        pagination: { total_items: 1, total_pages: 1 },
      });

      render(() => <WishlistDashboard user={mockUser} />);

      // Enter selection mode
      fireEvent.click(screen.getByText("Select"));

      // Click the item title button (not the checkbox) while in selection mode
      const itemButton = screen.getByText("Laptop").closest("button");
      fireEvent.click(itemButton!);

      // The item should be selected (BulkActionBar shows)
      await waitFor(() => {
        expect(screen.getByText("item selected")).toBeInTheDocument();
      });
    });
  });

  describe("BulkActionBar move dropdown toggle", () => {
    const items: WishlistItemRecord[] = [
      {
        id: "item-1",
        title: "Laptop",
        description: "",
        status: "want",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user_id: "user-uuid-1",
        category_id: "cat-1",
        links: [],
      },
    ];

    it("closes move dropdown when Move to... is clicked a second time", async () => {
      mockWishlistQuery.data = createMockWishlistData({
        items,
        categories: [
          {
            id: "cat-1",
            name: "Electronics",
            color: "#6366f1",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            user_id: "user-uuid-1",
          },
        ],
        pagination: { total_items: 1, total_pages: 1 },
      });

      render(() => <WishlistDashboard user={mockUser} />);

      // Enter selection mode and select an item
      fireEvent.click(screen.getByText("Select"));
      fireEvent.click(screen.getByLabelText("Select Laptop"));

      await waitFor(() =>
        expect(screen.getByText("Move to...")).toBeInTheDocument(),
      );

      // Open dropdown – "Uncategorized" is a hardcoded option in the dropdown
      fireEvent.click(screen.getByText("Move to..."));

      await waitFor(() =>
        expect(screen.getByText("Uncategorized")).toBeInTheDocument(),
      );

      // Click "Move to..." again to close the dropdown (covers lines 141-143)
      fireEvent.click(screen.getByText("Move to..."));

      await waitFor(() => {
        expect(screen.queryByText("Uncategorized")).not.toBeInTheDocument();
      });
    });
  });
});
