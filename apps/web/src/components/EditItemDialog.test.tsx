import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { EditItemDialog } from "./EditItemDialog";
import type {
  WishlistCategoryRecord,
  WishlistItemRecord,
} from "@repo/common/types/wishlist-record";

const mockUseDuplicateUrlCheck = vi.fn();

vi.mock("./useDuplicateUrlCheck", () => ({
  useDuplicateUrlCheck: (...args: unknown[]) =>
    mockUseDuplicateUrlCheck(...args),
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

const mockItem: WishlistItemRecord = {
  id: "item-1",
  user_id: "user-1",
  title: "Existing Item",
  description: "Existing description",
  category_id: "cat-1",
  created_at: "2024-01-15T10:00:00Z",
  updated_at: "2024-01-15T10:00:00Z",
  links: [
    {
      id: "link-1",
      item_id: "item-1",
      url: "https://example.com",
      description: "Example link",
      is_primary: true,
      created_at: "2024-01-15T10:00:00Z",
      updated_at: "2024-01-15T10:00:00Z",
    },
  ],
};

describe("EditItemDialog", () => {
  const mockOnOpenChange = vi.fn();
  const mockOnSubmit = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseDuplicateUrlCheck.mockReturnValue({
      handleUrlChange: vi.fn(),
      duplicateWarnings: () => ({}),
      reset: vi.fn(),
      cleanup: vi.fn(),
    });
  });

  it("renders nothing when open is false", () => {
    render(() => (
      <EditItemDialog
        open={false}
        onOpenChange={mockOnOpenChange}
        onSubmit={mockOnSubmit}
        categories={mockCategories}
        item={mockItem}
      />
    ));

    expect(screen.queryByText("Edit Wishlist Item")).not.toBeInTheDocument();
  });

  it("renders dialog when open is true", () => {
    render(() => (
      <EditItemDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onSubmit={mockOnSubmit}
        categories={mockCategories}
        item={mockItem}
      />
    ));

    expect(screen.getByText("Edit Wishlist Item")).toBeInTheDocument();
  });

  it("populates form with item data when opened", () => {
    render(() => (
      <EditItemDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onSubmit={mockOnSubmit}
        categories={mockCategories}
        item={mockItem}
      />
    ));

    const titleInput = screen.getByPlaceholderText(
      "Item title",
    ) as HTMLInputElement;
    expect(titleInput.value).toBe("Existing Item");

    const descriptionInput = screen.getByPlaceholderText(
      "Notes, size, color, etc.",
    ) as HTMLTextAreaElement;
    expect(descriptionInput.value).toBe("Existing description");
  });

  it("calls onOpenChange(false) when cancel button clicked", () => {
    render(() => (
      <EditItemDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onSubmit={mockOnSubmit}
        categories={mockCategories}
        item={mockItem}
      />
    ));

    fireEvent.click(screen.getByText("Cancel"));
    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
  });

  it("calls onOpenChange(false) when X button clicked", () => {
    render(() => (
      <EditItemDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onSubmit={mockOnSubmit}
        categories={mockCategories}
        item={mockItem}
      />
    ));

    fireEvent.click(screen.getByText("×"));
    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
  });

  it("Update Item button is disabled when title is empty", async () => {
    render(() => (
      <EditItemDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onSubmit={mockOnSubmit}
        categories={mockCategories}
        item={mockItem}
      />
    ));

    const titleInput = screen.getByPlaceholderText("Item title");
    fireEvent.input(titleInput, { target: { value: "" } });

    await waitFor(() => {
      expect(screen.getByText("Update Item")).toBeDisabled();
    });
  });

  it("submits form with updated payload", async () => {
    render(() => (
      <EditItemDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onSubmit={mockOnSubmit}
        categories={mockCategories}
        item={mockItem}
      />
    ));

    const titleInput = screen.getByPlaceholderText("Item title");
    fireEvent.input(titleInput, { target: { value: "Updated Title" } });

    const descriptionInput = screen.getByPlaceholderText(
      "Notes, size, color, etc.",
    );
    fireEvent.input(descriptionInput, { target: { value: "Updated notes" } });

    const form = titleInput.closest("form")!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "item-1",
          title: "Updated Title",
          description: "Updated notes",
        }),
      );
    });
  });

  it("does not submit when item is null", async () => {
    render(() => (
      <EditItemDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onSubmit={mockOnSubmit}
        categories={mockCategories}
        item={null}
      />
    ));

    const form = screen.getByPlaceholderText("Item title").closest("form")!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });
  });

  it("shows submitting state when submitting prop is true", () => {
    render(() => (
      <EditItemDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onSubmit={mockOnSubmit}
        categories={mockCategories}
        item={mockItem}
        submitting={true}
      />
    ));

    expect(screen.getByText("Updating...")).toBeInTheDocument();
  });

  it("disables cancel button when submitting", () => {
    render(() => (
      <EditItemDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onSubmit={mockOnSubmit}
        categories={mockCategories}
        item={mockItem}
        submitting={true}
      />
    ));

    expect(screen.getByText("Cancel")).toBeDisabled();
  });

  it("renders categories in select dropdown", () => {
    render(() => (
      <EditItemDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onSubmit={mockOnSubmit}
        categories={mockCategories}
        item={mockItem}
      />
    ));

    expect(screen.getByText("Electronics")).toBeInTheDocument();
    expect(screen.getByText("Books")).toBeInTheDocument();
    // Also has "No category" option
    expect(screen.getByText("No category")).toBeInTheDocument();
  });

  it("resets form to original item values when dialog is closed and reopened", async () => {
    const [open, setOpen] = createSignal(true);

    render(() => (
      <EditItemDialog
        open={open()}
        onOpenChange={(val) => setOpen(val)}
        onSubmit={mockOnSubmit}
        categories={mockCategories}
        item={mockItem}
      />
    ));

    const titleInput = screen.getByPlaceholderText(
      "Item title",
    ) as HTMLInputElement;
    fireEvent.input(titleInput, { target: { value: "Modified title" } });

    // Close dialog and wait for it to unmount
    setOpen(false);
    await waitFor(() => {
      expect(screen.queryByText("Edit Wishlist Item")).not.toBeInTheDocument();
    });

    // Reopen dialog
    setOpen(true);

    // Verify form resets to the original item values
    await waitFor(() => {
      const resetTitleInput = screen.getByPlaceholderText(
        "Item title",
      ) as HTMLInputElement;
      expect(resetTitleInput.value).toBe("Existing Item");
    });
  });

  it("populates existing links when item has links", () => {
    render(() => (
      <EditItemDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onSubmit={mockOnSubmit}
        categories={mockCategories}
        item={mockItem}
      />
    ));

    const urlInput = screen.getByPlaceholderText(
      "Enter website URL",
    ) as HTMLInputElement;
    expect(urlInput.value).toBe("https://example.com");
  });

  it("submits with undefined description when description cleared", async () => {
    render(() => (
      <EditItemDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onSubmit={mockOnSubmit}
        categories={mockCategories}
        item={mockItem}
      />
    ));

    const titleInput = screen.getByPlaceholderText("Item title");
    const descriptionInput = screen.getByPlaceholderText(
      "Notes, size, color, etc.",
    );
    fireEvent.input(descriptionInput, { target: { value: "" } });

    const form = titleInput.closest("form")!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          description: undefined,
        }),
      );
    });
  });

  it("submits with null category_id when no category selected", async () => {
    const itemWithoutCategory: WishlistItemRecord = {
      ...mockItem,
      category_id: undefined,
    };

    render(() => (
      <EditItemDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onSubmit={mockOnSubmit}
        categories={mockCategories}
        item={itemWithoutCategory}
      />
    ));

    const titleInput = screen.getByPlaceholderText("Item title");
    const form = titleInput.closest("form")!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          category_id: null,
        }),
      );
    });
  });
});
