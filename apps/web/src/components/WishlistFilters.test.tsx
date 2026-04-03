import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { WishlistFilters } from "./WishlistFilters";
import type { StatusFilter, SortByOption } from "./WishlistFilters";

describe("WishlistFilters", () => {
  const mockOnAddItem = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Helper function to render WishlistFilters with signals
  const renderWishlistFilters = (
    overrides: {
      categoryName?: string;
      initialSearchQuery?: string;
      initialSortBy?: SortByOption;
      initialStatusFilter?: StatusFilter;
      onAddItem?: () => void;
    } = {},
  ) => {
    const [searchQuery, setSearchQuery] = createSignal(
      overrides.initialSearchQuery ?? "",
    );
    const [sortBy, setSortBy] = createSignal<SortByOption>(
      overrides.initialSortBy ?? "custom",
    );
    const [statusFilter, setStatusFilter] = createSignal<StatusFilter>(
      overrides.initialStatusFilter ?? "DEFAULT",
    );

    const result = render(() => (
      <WishlistFilters
        categoryName={overrides.categoryName ?? "All Items"}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        sortBy={sortBy}
        setSortBy={setSortBy}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        onAddItem={overrides.onAddItem ?? mockOnAddItem}
      />
    ));

    return {
      ...result,
      searchQuery,
      setSearchQuery,
      sortBy,
      setSortBy,
      statusFilter,
      setStatusFilter,
    };
  };

  describe("Rendering", () => {
    it("should render category name", () => {
      renderWishlistFilters({ categoryName: "Electronics" });
      expect(screen.getByText("Electronics")).toBeInTheDocument();
    });

    it("should render default category name", () => {
      renderWishlistFilters();
      expect(screen.getByText("All Items")).toBeInTheDocument();
    });

    it("should render Add Item button", () => {
      renderWishlistFilters();
      expect(screen.getByText("Add Item")).toBeInTheDocument();
    });

    it("should render search input", () => {
      renderWishlistFilters();
      expect(
        screen.getByPlaceholderText("Search items..."),
      ).toBeInTheDocument();
    });

    it("should render sort dropdown", () => {
      renderWishlistFilters();
      const sortSelect = screen.getByTestId("sort-dropdown");
      expect(sortSelect).toBeInTheDocument();
      expect(
        sortSelect.querySelector('option[value="custom"]'),
      ).toBeInTheDocument();
    });

    it("should render all sort options", () => {
      renderWishlistFilters();
      expect(screen.getByText("Custom Order")).toBeInTheDocument();
      expect(screen.getByText("Sort by Date")).toBeInTheDocument();
      expect(screen.getByText("Sort by Title")).toBeInTheDocument();
    });
  });

  describe("Search Input", () => {
    it("should display initial search query", () => {
      renderWishlistFilters({ initialSearchQuery: "test query" });
      const input = screen.getByPlaceholderText(
        "Search items...",
      ) as HTMLInputElement;
      expect(input.value).toBe("test query");
    });

    it("should update search query on input", () => {
      const { searchQuery } = renderWishlistFilters();
      const input = screen.getByPlaceholderText(
        "Search items...",
      ) as HTMLInputElement;

      fireEvent.input(input, { target: { value: "new search" } });
      expect(searchQuery()).toBe("new search");
    });

    it("should handle empty search query", () => {
      const { searchQuery } = renderWishlistFilters({
        initialSearchQuery: "something",
      });
      const input = screen.getByPlaceholderText(
        "Search items...",
      ) as HTMLInputElement;

      fireEvent.input(input, { target: { value: "" } });
      expect(searchQuery()).toBe("");
    });

    it("should handle special characters in search", () => {
      const { searchQuery } = renderWishlistFilters();
      const input = screen.getByPlaceholderText(
        "Search items...",
      ) as HTMLInputElement;

      fireEvent.input(input, { target: { value: "test@#$%^&*()" } });
      expect(searchQuery()).toBe("test@#$%^&*()");
      expect(input.value).toBe("test@#$%^&*()");
      // Verify component still renders correctly with special characters
      expect(screen.getByText("Add Item")).toBeInTheDocument();
    });
  });

  describe("Sort Dropdown", () => {
    it("should display initial sort value", () => {
      const { sortBy } = renderWishlistFilters({ initialSortBy: "date" });
      expect(sortBy()).toBe("date");
      const sortSelect = screen.getByTestId("sort-dropdown");
      expect(sortSelect).toBeInTheDocument();
      expect(
        sortSelect.querySelector('option[value="date"]'),
      ).toBeInTheDocument();
    });

    it.each([
      ["custom", "date"],
      ["date", "custom"],
      ["title", "custom"],
    ])(
      "should update sort value when %s is selected",
      (newValue, initialValue) => {
        const { sortBy } = renderWishlistFilters({
          initialSortBy: initialValue as SortByOption,
        });
        const sortSelect = screen.getByTestId("sort-dropdown");

        fireEvent.change(sortSelect, { target: { value: newValue } });
        expect(sortBy()).toBe(newValue);
      },
    );
  });

  describe("Status Filter Dropdown", () => {
    it("uses the provided initial status filter", () => {
      const { statusFilter } = renderWishlistFilters({
        initialStatusFilter: "WANT",
      });

      const statusSelect = screen.getByTestId("status-dropdown");
      expect(statusSelect).toBeInTheDocument();
      expect(statusFilter()).toBe("WANT");
    });

    it("updates the status filter when a new option is selected", () => {
      const { statusFilter } = renderWishlistFilters();
      const statusSelect = screen.getByTestId("status-dropdown");

      fireEvent.change(statusSelect, { target: { value: "PURCHASED" } });

      expect(statusFilter()).toBe("PURCHASED");
    });
  });

  describe("Add Item Button", () => {
    it("should call onAddItem when clicked", () => {
      renderWishlistFilters();
      const button = screen.getByText("Add Item");

      fireEvent.click(button);
      expect(mockOnAddItem).toHaveBeenCalledTimes(1);
    });

    it("should call custom onAddItem when provided", () => {
      const customOnAddItem = vi.fn();
      renderWishlistFilters({ onAddItem: customOnAddItem });
      const button = screen.getByText("Add Item");

      fireEvent.click(button);
      expect(customOnAddItem).toHaveBeenCalledTimes(1);
      expect(mockOnAddItem).not.toHaveBeenCalled();
    });

    it("should call onAddItem multiple times when clicked multiple times", () => {
      renderWishlistFilters();
      const button = screen.getByText("Add Item");

      fireEvent.click(button);
      fireEvent.click(button);
      fireEvent.click(button);

      expect(mockOnAddItem).toHaveBeenCalledTimes(3);
    });
  });

  describe("Integration", () => {
    it("should handle simultaneous search and sort changes", () => {
      const { searchQuery, sortBy } = renderWishlistFilters();

      const searchInput = screen.getByPlaceholderText(
        "Search items...",
      ) as HTMLInputElement;
      const sortSelect = screen.getByTestId("sort-dropdown");

      fireEvent.input(searchInput, { target: { value: "laptop" } });
      fireEvent.change(sortSelect, { target: { value: "title" } });

      expect(searchQuery()).toBe("laptop");
      expect(sortBy()).toBe("title");
    });

    it("should preserve search query when sort changes", () => {
      const { searchQuery } = renderWishlistFilters({
        initialSearchQuery: "keyboard",
      });

      const sortSelect = screen.getByTestId("sort-dropdown");
      fireEvent.change(sortSelect, { target: { value: "date" } });

      expect(searchQuery()).toBe("keyboard");
    });

    it("should preserve sort value when search changes", () => {
      const { sortBy } = renderWishlistFilters({ initialSortBy: "title" });

      const searchInput = screen.getByPlaceholderText(
        "Search items...",
      ) as HTMLInputElement;
      fireEvent.input(searchInput, { target: { value: "mouse" } });

      expect(sortBy()).toBe("title");
    });
  });

  describe("Accessibility", () => {
    it("should have search input with type text", () => {
      renderWishlistFilters();
      const input = screen.getByPlaceholderText(
        "Search items...",
      ) as HTMLInputElement;
      expect(input.type).toBe("text");
    });

    it("should render semantic HTML structure", () => {
      const { container } = renderWishlistFilters();
      const button = container.querySelector("button");
      expect(button).toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("should handle very long category names", () => {
      const longName = "A".repeat(100);
      renderWishlistFilters({ categoryName: longName });
      expect(screen.getByText(longName)).toBeInTheDocument();
    });

    it("should handle empty category name", () => {
      renderWishlistFilters({ categoryName: "" });
      expect(screen.queryByRole("heading")).toBeInTheDocument();
    });

    it("should handle very long search queries", () => {
      const { searchQuery } = renderWishlistFilters();
      const input = screen.getByPlaceholderText(
        "Search items...",
      ) as HTMLInputElement;

      const longQuery = "test ".repeat(50);
      fireEvent.input(input, { target: { value: longQuery } });
      expect(searchQuery()).toBe(longQuery);
    });
  });

  describe("Selection Mode", () => {
    const renderWithSelection = (
      overrides: {
        hasItems?: boolean;
        initialSelectionMode?: boolean;
      } = {},
    ) => {
      const [isSelectionMode, setIsSelectionMode] = createSignal(
        overrides.initialSelectionMode ?? false,
      );
      const [searchQuery, setSearchQuery] = createSignal("");
      const [sortBy, setSortBy] = createSignal<SortByOption>("custom");
      const [statusFilter, setStatusFilter] =
        createSignal<StatusFilter>("DEFAULT");
      const mockToggle = vi.fn(() => setIsSelectionMode((v) => !v));

      const result = render(() => (
        <WishlistFilters
          categoryName="Test"
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          sortBy={sortBy}
          setSortBy={setSortBy}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          onAddItem={mockOnAddItem}
          isSelectionMode={isSelectionMode}
          onToggleSelectionMode={mockToggle}
          hasItems={overrides.hasItems ?? true}
        />
      ));

      return { ...result, isSelectionMode, mockToggle };
    };

    it("shows Select button when hasItems is true and onToggleSelectionMode provided", () => {
      renderWithSelection({ hasItems: true });
      expect(screen.getByText("Select")).toBeInTheDocument();
    });

    it("hides Select button when hasItems is false and selection mode is off", () => {
      renderWithSelection({ hasItems: false, initialSelectionMode: false });
      expect(screen.queryByText("Select")).not.toBeInTheDocument();
    });

    it("shows Cancel button when in selection mode even if hasItems is false", () => {
      renderWithSelection({ hasItems: false, initialSelectionMode: true });
      expect(screen.getByText("Cancel")).toBeInTheDocument();
    });

    it("shows Cancel button when in selection mode", () => {
      renderWithSelection({ hasItems: true, initialSelectionMode: true });
      expect(screen.getByText("Cancel")).toBeInTheDocument();
    });

    it("hides Add Item button when in selection mode", () => {
      renderWithSelection({ hasItems: true, initialSelectionMode: true });
      expect(screen.queryByText("Add Item")).not.toBeInTheDocument();
    });

    it("calls onToggleSelectionMode when Select button is clicked", () => {
      const { mockToggle } = renderWithSelection({ hasItems: true });
      fireEvent.click(screen.getByText("Select"));
      expect(mockToggle).toHaveBeenCalledTimes(1);
    });

    it("toggles from Select to Cancel after click", () => {
      renderWithSelection({ hasItems: true });
      expect(screen.getByText("Select")).toBeInTheDocument();
      fireEvent.click(screen.getByText("Select"));
      expect(screen.getByText("Cancel")).toBeInTheDocument();
    });

    it("does not show Select button when onToggleSelectionMode is not provided", () => {
      renderWishlistFilters();
      expect(screen.queryByText("Select")).not.toBeInTheDocument();
    });
  });
});
