import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@solidjs/testing-library";
import { ItemDetailsModal } from "../../src/components/ItemDetailsModal";
import type {
  GraphQLWishlistItem,
  GraphQLWishlistCategory,
} from "@repo/common/graphql/types";

afterEach(() => cleanup());

const mockItem: GraphQLWishlistItem = {
  id: "item-1",
  title: "Test Item",
  description: "A test description",
  categoryId: "cat-1",
  favicon: null,
  status: "WANT",
  priority: 0,
  userId: "user-1",
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z",
  links: [
    {
      id: "link-1",
      url: "https://example.com",
      description: "Example Link",
      itemId: "item-1",
      isPrimary: true,
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-01T00:00:00Z",
    },
  ],
};

const mockCategory: GraphQLWishlistCategory = {
  id: "cat-1",
  name: "Electronics",
  color: "#ff0000",
  userId: "user-1",
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z",
};

describe("ItemDetailsModal", () => {
  it("renders nothing when item is undefined", () => {
    render(() => (
      <ItemDetailsModal
        item={undefined}
        category={undefined}
        onClose={vi.fn()}
        onOpenLink={vi.fn()}
      />
    ));
    expect(screen.queryByText("Test Item")).toBeNull();
  });

  it("renders item title when item is provided", () => {
    render(() => (
      <ItemDetailsModal
        item={mockItem}
        category={mockCategory}
        onClose={vi.fn()}
        onOpenLink={vi.fn()}
      />
    ));
    expect(screen.getByText("Test Item")).toBeInTheDocument();
  });

  it("shows category name when category is provided", () => {
    render(() => (
      <ItemDetailsModal
        item={mockItem}
        category={mockCategory}
        onClose={vi.fn()}
        onOpenLink={vi.fn()}
      />
    ));
    expect(screen.getByText("Electronics")).toBeInTheDocument();
  });

  it("shows 'Uncategorized' when category is undefined", () => {
    render(() => (
      <ItemDetailsModal
        item={mockItem}
        category={undefined}
        onClose={vi.fn()}
        onOpenLink={vi.fn()}
      />
    ));
    expect(screen.getByText("Uncategorized")).toBeInTheDocument();
  });

  it("shows description when present", () => {
    render(() => (
      <ItemDetailsModal
        item={mockItem}
        category={mockCategory}
        onClose={vi.fn()}
        onOpenLink={vi.fn()}
      />
    ));
    expect(screen.getByText("A test description")).toBeInTheDocument();
  });

  it("hides Notes section when description is null", () => {
    const itemWithoutDescription = { ...mockItem, description: null };
    render(() => (
      <ItemDetailsModal
        item={itemWithoutDescription}
        category={mockCategory}
        onClose={vi.fn()}
        onOpenLink={vi.fn()}
      />
    ));
    expect(screen.queryByText("Notes")).toBeNull();
  });

  it("shows link description as button text", () => {
    render(() => (
      <ItemDetailsModal
        item={mockItem}
        category={mockCategory}
        onClose={vi.fn()}
        onOpenLink={vi.fn()}
      />
    ));
    expect(screen.getByText("Example Link")).toBeInTheDocument();
  });

  it("shows link url when description is null", () => {
    const itemWithUrlLink = {
      ...mockItem,
      links: [{ ...mockItem.links[0]!, description: null }],
    };
    render(() => (
      <ItemDetailsModal
        item={itemWithUrlLink}
        category={mockCategory}
        onClose={vi.fn()}
        onOpenLink={vi.fn()}
      />
    ));
    expect(screen.getByText("https://example.com")).toBeInTheDocument();
  });

  it("shows 'No links saved' fallback when item has no links", () => {
    const itemWithoutLinks = { ...mockItem, links: [] };
    render(() => (
      <ItemDetailsModal
        item={itemWithoutLinks}
        category={mockCategory}
        onClose={vi.fn()}
        onOpenLink={vi.fn()}
      />
    ));
    expect(
      screen.getByText(/No links saved for this item yet/),
    ).toBeInTheDocument();
  });

  it("calls onClose when × button is clicked", () => {
    const onClose = vi.fn();
    render(() => (
      <ItemDetailsModal
        item={mockItem}
        category={mockCategory}
        onClose={onClose}
        onOpenLink={vi.fn()}
      />
    ));
    fireEvent.click(screen.getByText("×"));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("calls onClose when backdrop is clicked", () => {
    const onClose = vi.fn();
    render(() => (
      <ItemDetailsModal
        item={mockItem}
        category={mockCategory}
        onClose={onClose}
        onOpenLink={vi.fn()}
      />
    ));
    const backdrop = screen.getByTestId("modal-backdrop");
    fireEvent.click(backdrop);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("does not propagate clicks from inner content to backdrop", () => {
    const onClose = vi.fn();
    render(() => (
      <ItemDetailsModal
        item={mockItem}
        category={mockCategory}
        onClose={onClose}
        onOpenLink={vi.fn()}
      />
    ));
    const innerCard = screen.getByTestId("modal-content");
    fireEvent.click(innerCard);
    expect(onClose).not.toHaveBeenCalled();
  });

  it("calls onOpenLink when a link button is clicked", () => {
    const onOpenLink = vi.fn();
    render(() => (
      <ItemDetailsModal
        item={mockItem}
        category={mockCategory}
        onClose={vi.fn()}
        onOpenLink={onOpenLink}
      />
    ));
    fireEvent.click(screen.getByText("Example Link"));
    expect(onOpenLink).toHaveBeenCalledWith("https://example.com");
  });

  it("displays 'Added' date from createdAt", () => {
    render(() => (
      <ItemDetailsModal
        item={mockItem}
        category={mockCategory}
        onClose={vi.fn()}
        onOpenLink={vi.fn()}
      />
    ));
    expect(screen.getByText(/Added/)).toBeInTheDocument();
  });
});
