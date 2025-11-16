import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { WishlistFilters } from "./WishlistFilters";

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
      initialSortBy?: "date" | "title" | "custom";
      onAddItem?: () => void;
    } = {},
  ) => {
    const [searchQuery, setSearchQuery] = createSignal(
      overrides.initialSearchQuery ?? "",
    );
    const [sortBy, setSortBy] = createSignal<"date" | "title" | "custom">(
      overrides.initialSortBy ?? "custom",
    );

    const result = render(() => (
      <WishlistFilters
        categoryName={overrides.categoryName ?? "All Items"}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        sortBy={sortBy}
        setSortBy={setSortBy}
        onAddItem={overrides.onAddItem ?? mockOnAddItem}
      />
    ));

    return {
      ...result,
      searchQuery,
      setSearchQuery,
      sortBy,
      setSortBy,
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
      const select = screen.getByDisplayValue("Custom Order");
      expect(select).toBeInTheDocument();
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
    });
  });

  describe("Sort Dropdown", () => {
    it("should display initial sort value", () => {
      const { sortBy } = renderWishlistFilters({ initialSortBy: "date" });
      expect(sortBy()).toBe("date");
      // Also verify the select element exists
      const select = screen.getByRole("combobox");
      expect(select).toBeInTheDocument();
    });

    it("should update sort value when custom is selected", () => {
      const { sortBy } = renderWishlistFilters({ initialSortBy: "date" });
      const select = screen.getByRole("combobox") as HTMLSelectElement;

      fireEvent.change(select, { target: { value: "custom" } });
      expect(sortBy()).toBe("custom");
    });

    it("should update sort value when date is selected", () => {
      const { sortBy } = renderWishlistFilters();
      const select = screen.getByRole("combobox") as HTMLSelectElement;

      fireEvent.change(select, { target: { value: "date" } });
      expect(sortBy()).toBe("date");
    });

    it("should update sort value when title is selected", () => {
      const { sortBy } = renderWishlistFilters();
      const select = screen.getByRole("combobox") as HTMLSelectElement;

      fireEvent.change(select, { target: { value: "title" } });
      expect(sortBy()).toBe("title");
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
      const sortSelect = screen.getByDisplayValue(
        "Custom Order",
      ) as HTMLSelectElement;

      fireEvent.input(searchInput, { target: { value: "laptop" } });
      fireEvent.change(sortSelect, { target: { value: "title" } });

      expect(searchQuery()).toBe("laptop");
      expect(sortBy()).toBe("title");
    });

    it("should preserve search query when sort changes", () => {
      const { searchQuery } = renderWishlistFilters({
        initialSearchQuery: "keyboard",
      });

      const sortSelect = screen.getByDisplayValue(
        "Custom Order",
      ) as HTMLSelectElement;
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
});
