import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@solidjs/testing-library";
import { CategoryManager } from "./CategoryManager";
import type { WishlistCategoryRecord } from "@repo/common/types/wishlist-record";

// Mock GraphQL hooks
const mockCreateCategoryMutation = {
  mutateAsync: vi.fn().mockResolvedValue({}),
  isPending: false,
};
const mockDeleteCategoryMutation = {
  mutateAsync: vi.fn().mockResolvedValue({}),
  isPending: false,
};

vi.mock("../lib/graphql/hooks/use-wishlist", () => ({
  useCreateCategory: () => mockCreateCategoryMutation,
  useDeleteCategory: () => mockDeleteCategoryMutation,
}));

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

describe("CategoryManager", () => {
  const mockOnRefetch = vi.fn().mockResolvedValue(undefined);
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateCategoryMutation.mutateAsync.mockReset().mockResolvedValue({});
    mockDeleteCategoryMutation.mutateAsync.mockReset().mockResolvedValue({});
  });

  it("renders the Manage Categories heading", () => {
    render(() => (
      <CategoryManager categories={mockCategories} onRefetch={mockOnRefetch} />
    ));

    expect(screen.getByText("Manage Categories")).toBeInTheDocument();
  });

  it("renders existing categories", () => {
    render(() => (
      <CategoryManager categories={mockCategories} onRefetch={mockOnRefetch} />
    ));

    expect(screen.getByText("Electronics")).toBeInTheDocument();
    expect(screen.getByText("Books")).toBeInTheDocument();
  });

  it("renders Add New Category section", () => {
    render(() => (
      <CategoryManager categories={mockCategories} onRefetch={mockOnRefetch} />
    ));

    expect(screen.getByText("Add New Category")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Category name...")).toBeInTheDocument();
  });

  it("renders Add button initially disabled when name is empty", () => {
    render(() => (
      <CategoryManager categories={mockCategories} onRefetch={mockOnRefetch} />
    ));

    expect(screen.getByText("Add")).toBeDisabled();
  });

  it("enables Add button when name is entered", async () => {
    render(() => (
      <CategoryManager categories={mockCategories} onRefetch={mockOnRefetch} />
    ));

    const input = screen.getByPlaceholderText("Category name...");
    fireEvent.input(input, { target: { value: "New Category" } });

    await waitFor(() => {
      expect(screen.getByText("Add")).not.toBeDisabled();
    });
  });

  it("adds category when Add button clicked", async () => {
    render(() => (
      <CategoryManager categories={mockCategories} onRefetch={mockOnRefetch} />
    ));

    const input = screen.getByPlaceholderText("Category name...");
    fireEvent.input(input, { target: { value: "New Category" } });
    fireEvent.click(screen.getByText("Add"));

    await waitFor(() => {
      expect(mockCreateCategoryMutation.mutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({ name: "New Category" }),
      );
      expect(mockOnRefetch).toHaveBeenCalled();
    });
  });

  it("adds category when Enter key pressed in input", async () => {
    render(() => (
      <CategoryManager categories={mockCategories} onRefetch={mockOnRefetch} />
    ));

    const input = screen.getByPlaceholderText("Category name...");
    fireEvent.input(input, { target: { value: "Keyboard Category" } });
    fireEvent.keyDown(input, { key: "Enter", code: "Enter" });

    await waitFor(() => {
      expect(mockCreateCategoryMutation.mutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({ name: "Keyboard Category" }),
      );
    });
  });

  it("does not add category when name is empty or whitespace", async () => {
    render(() => (
      <CategoryManager categories={mockCategories} onRefetch={mockOnRefetch} />
    ));

    const input = screen.getByPlaceholderText("Category name...");
    fireEvent.input(input, { target: { value: "   " } });
    fireEvent.keyDown(input, { key: "Enter", code: "Enter" });

    await waitFor(() => {
      expect(mockCreateCategoryMutation.mutateAsync).not.toHaveBeenCalled();
    });
  });

  it("shows error message when add category fails", async () => {
    mockCreateCategoryMutation.mutateAsync = vi
      .fn()
      .mockRejectedValue(new Error("Network error"));

    render(() => (
      <CategoryManager categories={mockCategories} onRefetch={mockOnRefetch} />
    ));

    const input = screen.getByPlaceholderText("Category name...");
    fireEvent.input(input, { target: { value: "New Category" } });
    fireEvent.click(screen.getByText("Add"));

    await waitFor(() => {
      expect(screen.getByText("Network error")).toBeInTheDocument();
    });
  });

  it("renders Remove button for each category", () => {
    render(() => (
      <CategoryManager categories={mockCategories} onRefetch={mockOnRefetch} />
    ));

    const removeButtons = screen.getAllByText("Remove");
    expect(removeButtons).toHaveLength(2);
  });

  it("opens confirm dialog when Remove is clicked", async () => {
    render(() => (
      <CategoryManager categories={mockCategories} onRefetch={mockOnRefetch} />
    ));

    fireEvent.click(screen.getAllByText("Remove")[0]!);

    await waitFor(() => {
      expect(screen.getByText("Delete Category")).toBeInTheDocument();
    });
  });

  it("shows category name in confirm dialog", async () => {
    render(() => (
      <CategoryManager categories={mockCategories} onRefetch={mockOnRefetch} />
    ));

    fireEvent.click(screen.getAllByText("Remove")[0]!);

    await waitFor(() => {
      expect(
        screen.getByText(/Are you sure you want to delete "Electronics"/),
      ).toBeInTheDocument();
    });
  });

  it("deletes category when confirmed", async () => {
    render(() => (
      <CategoryManager categories={mockCategories} onRefetch={mockOnRefetch} />
    ));

    fireEvent.click(screen.getAllByText("Remove")[0]!);

    await waitFor(() => {
      expect(screen.getByText("Delete Category")).toBeInTheDocument();
    });

    // Click the confirm Delete button in dialog
    const deleteButtons = screen.getAllByText("Delete");
    fireEvent.click(deleteButtons[deleteButtons.length - 1]!);

    await waitFor(() => {
      expect(mockDeleteCategoryMutation.mutateAsync).toHaveBeenCalledWith(
        "cat-1",
      );
      expect(mockOnRefetch).toHaveBeenCalled();
    });
  });

  it("shows error when delete category fails", async () => {
    mockDeleteCategoryMutation.mutateAsync = vi
      .fn()
      .mockRejectedValue(new Error("Delete failed"));

    render(() => (
      <CategoryManager categories={mockCategories} onRefetch={mockOnRefetch} />
    ));

    fireEvent.click(screen.getAllByText("Remove")[0]!);

    await waitFor(() => {
      expect(screen.getByText("Delete Category")).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByText("Delete");
    fireEvent.click(deleteButtons[deleteButtons.length - 1]!);

    await waitFor(() => {
      expect(screen.getByText("Delete failed")).toBeInTheDocument();
    });
  });

  it("renders close button when onClose is provided", () => {
    render(() => (
      <CategoryManager
        categories={mockCategories}
        onRefetch={mockOnRefetch}
        onClose={mockOnClose}
      />
    ));

    expect(screen.getByText("✕")).toBeInTheDocument();
  });

  it("does not render close button when onClose is not provided", () => {
    render(() => (
      <CategoryManager categories={mockCategories} onRefetch={mockOnRefetch} />
    ));

    expect(screen.queryByText("✕")).not.toBeInTheDocument();
  });

  it("calls onClose when close button is clicked", () => {
    render(() => (
      <CategoryManager
        categories={mockCategories}
        onRefetch={mockOnRefetch}
        onClose={mockOnClose}
      />
    ));

    fireEvent.click(screen.getByText("✕"));
    expect(mockOnClose).toHaveBeenCalled();
  });

  it("resets input after successful add", async () => {
    render(() => (
      <CategoryManager categories={mockCategories} onRefetch={mockOnRefetch} />
    ));

    const input = screen.getByPlaceholderText(
      "Category name...",
    ) as HTMLInputElement;
    fireEvent.input(input, { target: { value: "New Category" } });
    fireEvent.click(screen.getByText("Add"));

    await waitFor(() => {
      expect(input.value).toBe("");
    });
  });

  it("renders color dot for each category", () => {
    render(() => (
      <CategoryManager categories={mockCategories} onRefetch={mockOnRefetch} />
    ));

    const colorDots = screen.getAllByTestId("category-color");
    expect(colorDots).toHaveLength(2);
  });

  it("renders random color button", () => {
    render(() => (
      <CategoryManager categories={mockCategories} onRefetch={mockOnRefetch} />
    ));

    expect(screen.getByTitle("Random color")).toBeInTheDocument();
  });

  it("renders empty categories list message when no categories", () => {
    render(() => <CategoryManager categories={[]} onRefetch={mockOnRefetch} />);

    expect(screen.getByText("Existing Categories")).toBeInTheDocument();
    // No Remove buttons
    expect(screen.queryByText("Remove")).not.toBeInTheDocument();
  });
});
