import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { AddItemDialog } from "./AddItemDialog";
import type { WishlistCategoryRecord } from "@repo/common/types/wishlist-record";

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

describe("AddItemDialog", () => {
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
      <AddItemDialog
        open={false}
        onOpenChange={mockOnOpenChange}
        onSubmit={mockOnSubmit}
        categories={mockCategories}
      />
    ));

    expect(screen.queryByText("Add Wishlist Item")).not.toBeInTheDocument();
  });

  it("renders dialog when open is true", () => {
    render(() => (
      <AddItemDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onSubmit={mockOnSubmit}
        categories={mockCategories}
      />
    ));

    expect(screen.getByText("Add Wishlist Item")).toBeInTheDocument();
    expect(
      screen.getByText("Provide details for the item you'd like to add."),
    ).toBeInTheDocument();
  });

  it("renders title input", () => {
    render(() => (
      <AddItemDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onSubmit={mockOnSubmit}
        categories={mockCategories}
      />
    ));

    expect(screen.getByPlaceholderText("Item title")).toBeInTheDocument();
  });

  it("renders description textarea", () => {
    render(() => (
      <AddItemDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onSubmit={mockOnSubmit}
        categories={mockCategories}
      />
    ));

    expect(
      screen.getByPlaceholderText("Notes, size, color, etc."),
    ).toBeInTheDocument();
  });

  it("renders category selector when categories are provided", () => {
    render(() => (
      <AddItemDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onSubmit={mockOnSubmit}
        categories={mockCategories}
      />
    ));

    expect(screen.getByText("Electronics")).toBeInTheDocument();
    expect(screen.getByText("Books")).toBeInTheDocument();
  });

  it("does not render category selector when no categories", () => {
    render(() => (
      <AddItemDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onSubmit={mockOnSubmit}
        categories={[]}
      />
    ));

    expect(screen.queryByText("Category")).not.toBeInTheDocument();
  });

  it("calls onOpenChange(false) when cancel button is clicked", () => {
    render(() => (
      <AddItemDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onSubmit={mockOnSubmit}
        categories={mockCategories}
      />
    ));

    fireEvent.click(screen.getByText("Cancel"));
    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
  });

  it("calls onOpenChange(false) when X button is clicked", () => {
    render(() => (
      <AddItemDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onSubmit={mockOnSubmit}
        categories={mockCategories}
      />
    ));

    fireEvent.click(screen.getByText("×"));
    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
  });

  it("Add Item button is disabled when title is empty", () => {
    render(() => (
      <AddItemDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onSubmit={mockOnSubmit}
        categories={mockCategories}
      />
    ));

    const submitButton = screen.getByText("Add Item");
    expect(submitButton).toBeDisabled();
  });

  it("Add Item button is enabled when title is filled", async () => {
    render(() => (
      <AddItemDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onSubmit={mockOnSubmit}
        categories={mockCategories}
      />
    ));

    const titleInput = screen.getByPlaceholderText("Item title");
    fireEvent.input(titleInput, { target: { value: "My new item" } });

    await waitFor(() => {
      const submitButton = screen.getByText("Add Item");
      expect(submitButton).not.toBeDisabled();
    });
  });

  it("submits form with correct payload", async () => {
    render(() => (
      <AddItemDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onSubmit={mockOnSubmit}
        categories={mockCategories}
      />
    ));

    const titleInput = screen.getByPlaceholderText("Item title");
    fireEvent.input(titleInput, { target: { value: "My new item" } });

    const descriptionInput = screen.getByPlaceholderText(
      "Notes, size, color, etc.",
    );
    fireEvent.input(descriptionInput, { target: { value: "Some notes" } });

    const form = titleInput.closest("form")!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "My new item",
          description: "Some notes",
          links: [],
        }),
      );
    });
  });

  it("does not submit when title is empty or whitespace", async () => {
    render(() => (
      <AddItemDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onSubmit={mockOnSubmit}
        categories={mockCategories}
      />
    ));

    const titleInput = screen.getByPlaceholderText("Item title");
    fireEvent.input(titleInput, { target: { value: "   " } });

    const form = titleInput.closest("form")!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });
  });

  it("shows submitting state when submitting prop is true", () => {
    render(() => (
      <AddItemDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onSubmit={mockOnSubmit}
        categories={mockCategories}
        submitting={true}
      />
    ));

    expect(screen.getByText("Adding...")).toBeInTheDocument();
  });

  it("disables buttons when submitting", () => {
    render(() => (
      <AddItemDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onSubmit={mockOnSubmit}
        categories={mockCategories}
        submitting={true}
      />
    ));

    expect(screen.getByText("Cancel")).toBeDisabled();
  });

  it("resets fields when dialog reopens", async () => {
    const [open, setOpen] = createSignal(true);

    render(() => (
      <AddItemDialog
        open={open()}
        onOpenChange={(val) => setOpen(val)}
        onSubmit={mockOnSubmit}
        categories={mockCategories}
      />
    ));

    const titleInput = screen.getByPlaceholderText(
      "Item title",
    ) as HTMLInputElement;
    fireEvent.input(titleInput, { target: { value: "Some title" } });

    setOpen(false);
    await waitFor(() => {
      expect(
        screen.queryByPlaceholderText("Item title"),
      ).not.toBeInTheDocument();
    });
    setOpen(true);

    await waitFor(() => {
      const newTitleInput = screen.getByPlaceholderText(
        "Item title",
      ) as HTMLInputElement;
      expect(newTitleInput.value).toBe("");
    });
  });

  it("uses first category as default when no initialCategoryId", async () => {
    render(() => (
      <AddItemDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onSubmit={mockOnSubmit}
        categories={mockCategories}
      />
    ));

    const titleInput = screen.getByPlaceholderText("Item title");
    fireEvent.input(titleInput, { target: { value: "Test" } });
    const form = titleInput.closest("form")!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          category_id: "cat-1",
        }),
      );
    });
  });

  it("uses initialCategoryId when provided", async () => {
    render(() => (
      <AddItemDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onSubmit={mockOnSubmit}
        categories={mockCategories}
        initialCategoryId="cat-2"
      />
    ));

    const titleInput = screen.getByPlaceholderText("Item title");
    fireEvent.input(titleInput, { target: { value: "Test" } });
    const form = titleInput.closest("form")!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          category_id: "cat-2",
        }),
      );
    });
  });

  it("submits with undefined description when description is empty", async () => {
    render(() => (
      <AddItemDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onSubmit={mockOnSubmit}
        categories={mockCategories}
      />
    ));

    const titleInput = screen.getByPlaceholderText("Item title");
    fireEvent.input(titleInput, { target: { value: "Test item" } });

    const form = titleInput.closest("form")!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Test item",
          description: undefined,
        }),
      );
    });
  });

  it("submits the selected status in the add item payload", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(() => (
      <AddItemDialog
        open={true}
        onOpenChange={vi.fn()}
        onSubmit={onSubmit}
        categories={mockCategories}
      />
    ));

    fireEvent.input(screen.getByPlaceholderText("Item title"), {
      target: { value: "Desk Lamp" },
    });
    fireEvent.change(screen.getByLabelText("Status"), {
      target: { value: "purchased" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add Item" }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Desk Lamp",
          status: "purchased",
        }),
      );
    });
  });
});
