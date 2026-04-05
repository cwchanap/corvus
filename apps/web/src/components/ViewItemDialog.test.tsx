import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@solidjs/testing-library";
import { ViewItemDialog } from "./ViewItemDialog";
import type {
  WishlistCategoryRecord,
  WishlistItemRecord,
} from "@repo/common/types/wishlist-record";

const mockCategories: WishlistCategoryRecord[] = [
  {
    id: "cat-1",
    user_id: "user-1",
    name: "Electronics",
    color: "#3b82f6",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
  {
    id: "cat-2",
    user_id: "user-1",
    name: "Books",
    color: "#22c55e",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
];

const mockItem: WishlistItemRecord = {
  id: "item-1",
  user_id: "user-1",
  title: "Test Item",
  description: "A test description",
  category_id: "cat-1",
  created_at: "2024-01-15T10:00:00Z",
  updated_at: "2024-01-15T10:00:00Z",
  links: [
    {
      id: "link-1",
      item_id: "item-1",
      url: "https://example.com",
      description: "Example site",
      is_primary: true,
      created_at: "2024-01-15T10:00:00Z",
      updated_at: "2024-01-15T10:00:00Z",
    },
    {
      id: "link-2",
      item_id: "item-1",
      url: "https://secondary.com",
      description: "",
      is_primary: false,
      created_at: "2024-01-15T10:00:00Z",
      updated_at: "2024-01-15T10:00:00Z",
    },
  ],
};

describe("ViewItemDialog", () => {
  const mockOnOpenChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders nothing when open is false", () => {
    render(() => (
      <ViewItemDialog
        open={false}
        onOpenChange={mockOnOpenChange}
        item={mockItem}
        categories={mockCategories}
      />
    ));

    expect(screen.queryByText("Test Item")).not.toBeInTheDocument();
  });

  it("renders nothing when item is null", () => {
    render(() => (
      <ViewItemDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        item={null}
        categories={mockCategories}
      />
    ));

    expect(screen.queryByText("Test Item")).not.toBeInTheDocument();
  });

  it("renders item title when open and item provided", () => {
    render(() => (
      <ViewItemDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        item={mockItem}
        categories={mockCategories}
      />
    ));

    expect(screen.getByText("Test Item")).toBeInTheDocument();
  });

  it("renders item description", () => {
    render(() => (
      <ViewItemDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        item={mockItem}
        categories={mockCategories}
      />
    ));

    expect(screen.getByText("A test description")).toBeInTheDocument();
    expect(screen.getByText("Notes")).toBeInTheDocument();
  });

  it("does not render description section when item has no description", () => {
    const itemWithoutDescription: WishlistItemRecord = {
      ...mockItem,
      description: undefined,
    };

    render(() => (
      <ViewItemDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        item={itemWithoutDescription}
        categories={mockCategories}
      />
    ));

    expect(screen.queryByText("Notes")).not.toBeInTheDocument();
  });

  it("renders category name correctly", () => {
    render(() => (
      <ViewItemDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        item={mockItem}
        categories={mockCategories}
      />
    ));

    expect(screen.getByText("Electronics")).toBeInTheDocument();
  });

  it("shows Uncategorized when item has no category_id", () => {
    const uncategorizedItem: WishlistItemRecord = {
      ...mockItem,
      category_id: undefined,
    };

    render(() => (
      <ViewItemDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        item={uncategorizedItem}
        categories={mockCategories}
      />
    ));

    expect(screen.getByText("Uncategorized")).toBeInTheDocument();
  });

  it("shows Uncategorized when category_id does not match any category", () => {
    const unknownCategoryItem: WishlistItemRecord = {
      ...mockItem,
      category_id: "unknown-id",
    };

    render(() => (
      <ViewItemDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        item={unknownCategoryItem}
        categories={mockCategories}
      />
    ));

    expect(screen.getByText("Uncategorized")).toBeInTheDocument();
  });

  it("renders links when item has links", () => {
    render(() => (
      <ViewItemDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        item={mockItem}
        categories={mockCategories}
      />
    ));

    expect(screen.getByText("Example site")).toBeInTheDocument();
    // Second link has no description so URL is used as text
    expect(screen.getByText("https://secondary.com")).toBeInTheDocument();
  });

  it("shows Primary badge for primary links", () => {
    render(() => (
      <ViewItemDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        item={mockItem}
        categories={mockCategories}
      />
    ));

    expect(screen.getByText("Primary")).toBeInTheDocument();
  });

  it("shows fallback text when item has no links", () => {
    const itemWithNoLinks: WishlistItemRecord = {
      ...mockItem,
      links: [],
    };

    render(() => (
      <ViewItemDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        item={itemWithNoLinks}
        categories={mockCategories}
      />
    ));

    expect(
      screen.getByText("No links saved for this item yet."),
    ).toBeInTheDocument();
  });

  it("shows fallback text when item links is undefined", () => {
    const itemWithNoLinks: WishlistItemRecord = {
      ...mockItem,
      links: undefined,
    };

    render(() => (
      <ViewItemDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        item={itemWithNoLinks}
        categories={mockCategories}
      />
    ));

    expect(
      screen.getByText("No links saved for this item yet."),
    ).toBeInTheDocument();
  });

  it("calls onOpenChange(false) when close button is clicked", () => {
    render(() => (
      <ViewItemDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        item={mockItem}
        categories={mockCategories}
      />
    ));

    const closeButton = screen.getByText("×");
    fireEvent.click(closeButton);

    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
  });

  it("renders link URLs as anchor tags with correct href", () => {
    render(() => (
      <ViewItemDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        item={mockItem}
        categories={mockCategories}
      />
    ));

    const primaryLink = screen.getByText("Example site") as HTMLAnchorElement;
    expect(primaryLink.tagName).toBe("A");
    expect(primaryLink.href).toBe("https://example.com/");
    expect(primaryLink.target).toBe("_blank");
    expect(primaryLink.rel).toContain("noopener");
  });

  it("renders link URL as text when description is empty", () => {
    render(() => (
      <ViewItemDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        item={mockItem}
        categories={mockCategories}
      />
    ));

    const secondaryLink = screen.getByText(
      "https://secondary.com",
    ) as HTMLAnchorElement;
    expect(secondaryLink.tagName).toBe("A");
    expect(secondaryLink.href).toBe("https://secondary.com/");
  });
});
