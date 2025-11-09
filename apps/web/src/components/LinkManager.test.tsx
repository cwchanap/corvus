import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@solidjs/testing-library";
import { LinkManager, type LinkItem } from "./LinkManager";

describe("LinkManager", () => {
  const mockOnAddLink = vi.fn();
  const mockOnUpdateLink = vi.fn();
  const mockOnRemoveLink = vi.fn();
  const mockOnRemoveAllLinks = vi.fn();

  // Helper function to create mock links
  const createMockLink = (
    url: string,
    description: string,
    isPrimary = false,
    id = "1",
  ): LinkItem => ({
    id,
    url,
    description,
    isPrimary,
  });

  it("should render empty state when no links are provided", () => {
    render(() => (
      <LinkManager
        links={[]}
        onAddLink={mockOnAddLink}
        onUpdateLink={mockOnUpdateLink}
        onRemoveLink={mockOnRemoveLink}
        onRemoveAllLinks={mockOnRemoveAllLinks}
      />
    ));

    expect(screen.getByText("No links added yet")).toBeInTheDocument();
    expect(
      screen.getByText(
        "You can add links now or later after creating the item",
      ),
    ).toBeInTheDocument();
  });

  it("should render custom empty state messages when provided", () => {
    const customMessage = "Custom empty message";
    const customSubMessage = "Custom sub message";

    render(() => (
      <LinkManager
        links={[]}
        onAddLink={mockOnAddLink}
        onUpdateLink={mockOnUpdateLink}
        onRemoveLink={mockOnRemoveLink}
        onRemoveAllLinks={mockOnRemoveAllLinks}
        emptyMessage={customMessage}
        emptySubMessage={customSubMessage}
      />
    ));

    expect(screen.getByText(customMessage)).toBeInTheDocument();
    expect(screen.getByText(customSubMessage)).toBeInTheDocument();
  });

  it("should render links when provided", () => {
    const mockLinks: LinkItem[] = [
      createMockLink("https://example.com", "Example site"),
      createMockLink("https://test.com", "Test site", false, "2"),
    ];

    render(() => (
      <LinkManager
        links={mockLinks}
        onAddLink={mockOnAddLink}
        onUpdateLink={mockOnUpdateLink}
        onRemoveLink={mockOnRemoveLink}
        onRemoveAllLinks={mockOnRemoveAllLinks}
      />
    ));

    expect(
      screen.getByPlaceholderText("Enter website URL"),
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Link description (optional)"),
    ).toBeInTheDocument();
  });

  it("should not show 'Remove All' button when no links are visible", () => {
    render(() => (
      <LinkManager
        links={[]}
        onAddLink={mockOnAddLink}
        onUpdateLink={mockOnUpdateLink}
        onRemoveLink={mockOnRemoveLink}
        onRemoveAllLinks={mockOnRemoveAllLinks}
      />
    ));

    expect(screen.queryByText("Remove All")).not.toBeInTheDocument();
  });

  it("should show 'Remove All' button when links are visible", () => {
    const mockLinks: LinkItem[] = [
      createMockLink("https://example.com", "Example site"),
    ];

    render(() => (
      <LinkManager
        links={mockLinks}
        onAddLink={mockOnAddLink}
        onUpdateLink={mockOnUpdateLink}
        onRemoveLink={mockOnRemoveLink}
        onRemoveAllLinks={mockOnRemoveAllLinks}
      />
    ));

    expect(screen.getByText("Remove All")).toBeInTheDocument();
  });

  it("should call onAddLink when 'Add Link' button is clicked", () => {
    render(() => (
      <LinkManager
        links={[]}
        onAddLink={mockOnAddLink}
        onUpdateLink={mockOnUpdateLink}
        onRemoveLink={mockOnRemoveLink}
        onRemoveAllLinks={mockOnRemoveAllLinks}
      />
    ));

    const addButton = screen.getByText("+ Add Link");
    fireEvent.click(addButton);

    expect(mockOnAddLink).toHaveBeenCalledTimes(1);
  });

  it("should call onRemoveAllLinks when 'Remove All' button is clicked", () => {
    const mockLinks: LinkItem[] = [
      createMockLink("https://example.com", "Example site"),
    ];

    render(() => (
      <LinkManager
        links={mockLinks}
        onAddLink={mockOnAddLink}
        onUpdateLink={mockOnUpdateLink}
        onRemoveLink={mockOnRemoveLink}
        onRemoveAllLinks={mockOnRemoveAllLinks}
      />
    ));

    const removeAllButton = screen.getByText("Remove All");
    fireEvent.click(removeAllButton);

    expect(mockOnRemoveAllLinks).toHaveBeenCalledTimes(1);
  });

  it("should call onRemoveLink with correct index when Remove button is clicked", () => {
    const mockLinks: LinkItem[] = [
      createMockLink("https://example.com", "Example site"),
      createMockLink("https://test.com", "Test site", false, "2"),
    ];

    render(() => (
      <LinkManager
        links={mockLinks}
        onAddLink={mockOnAddLink}
        onUpdateLink={mockOnUpdateLink}
        onRemoveLink={mockOnRemoveLink}
        onRemoveAllLinks={mockOnRemoveAllLinks}
      />
    ));

    const removeButtons = screen.getAllByText("Remove");
    fireEvent.click(removeButtons[0]!);

    expect(mockOnRemoveLink).toHaveBeenCalledWith(0);
  });

  it("should call onUpdateLink when URL input changes", () => {
    const mockLinks: LinkItem[] = [
      createMockLink("https://example.com", "Example site"),
    ];

    render(() => (
      <LinkManager
        links={mockLinks}
        onAddLink={mockOnAddLink}
        onUpdateLink={mockOnUpdateLink}
        onRemoveLink={mockOnRemoveLink}
        onRemoveAllLinks={mockOnRemoveAllLinks}
      />
    ));

    const urlInput = screen.getByPlaceholderText(
      "Enter website URL",
    ) as HTMLInputElement;
    fireEvent.input(urlInput, { target: { value: "https://newurl.com" } });

    expect(mockOnUpdateLink).toHaveBeenCalledWith(
      0,
      "url",
      "https://newurl.com",
    );
  });

  it("should call onUpdateLink when description input changes", () => {
    const mockLinks: LinkItem[] = [
      createMockLink("https://example.com", "Example site"),
    ];

    render(() => (
      <LinkManager
        links={mockLinks}
        onAddLink={mockOnAddLink}
        onUpdateLink={mockOnUpdateLink}
        onRemoveLink={mockOnRemoveLink}
        onRemoveAllLinks={mockOnRemoveAllLinks}
      />
    ));

    const descriptionInput = screen.getByPlaceholderText(
      "Link description (optional)",
    ) as HTMLInputElement;
    fireEvent.input(descriptionInput, {
      target: { value: "New description" },
    });

    expect(mockOnUpdateLink).toHaveBeenCalledWith(
      0,
      "description",
      "New description",
    );
  });

  it("should filter out deleted links from visible links", () => {
    const mockLinks: LinkItem[] = [
      createMockLink("https://example.com", "Example site"),
      {
        ...createMockLink("https://test.com", "Test site", false, "2"),
        isDeleted: true,
      },
    ];

    render(() => (
      <LinkManager
        links={mockLinks}
        onAddLink={mockOnAddLink}
        onUpdateLink={mockOnUpdateLink}
        onRemoveLink={mockOnRemoveLink}
        onRemoveAllLinks={mockOnRemoveAllLinks}
      />
    ));

    // Should only render one link (the non-deleted one)
    const removeButtons = screen.queryAllByText("Remove");
    expect(removeButtons).toHaveLength(1);
  });

  it("should show empty state when all links are deleted", () => {
    const mockLinks: LinkItem[] = [
      {
        ...createMockLink("https://example.com", "Example site"),
        isDeleted: true,
      },
      {
        ...createMockLink("https://test.com", "Test site", false, "2"),
        isDeleted: true,
      },
    ];

    render(() => (
      <LinkManager
        links={mockLinks}
        onAddLink={mockOnAddLink}
        onUpdateLink={mockOnUpdateLink}
        onRemoveLink={mockOnRemoveLink}
        onRemoveAllLinks={mockOnRemoveAllLinks}
      />
    ));

    expect(screen.getByText("No links added yet")).toBeInTheDocument();
    expect(screen.queryByText("Remove All")).not.toBeInTheDocument();
  });

  it("should render link inputs with correct initial values", () => {
    const mockLinks: LinkItem[] = [
      createMockLink("https://example.com", "Example description"),
    ];

    render(() => (
      <LinkManager
        links={mockLinks}
        onAddLink={mockOnAddLink}
        onUpdateLink={mockOnUpdateLink}
        onRemoveLink={mockOnRemoveLink}
        onRemoveAllLinks={mockOnRemoveAllLinks}
      />
    ));

    const urlInput = screen.getByPlaceholderText(
      "Enter website URL",
    ) as HTMLInputElement;
    const descriptionInput = screen.getByPlaceholderText(
      "Link description (optional)",
    ) as HTMLInputElement;

    expect(urlInput.value).toBe("https://example.com");
    expect(descriptionInput.value).toBe("Example description");
  });

  it("should render multiple links correctly", () => {
    const mockLinks: LinkItem[] = [
      createMockLink("https://example1.com", "Example 1", false, "1"),
      createMockLink("https://example2.com", "Example 2", false, "2"),
      createMockLink("https://example3.com", "Example 3", false, "3"),
    ];

    render(() => (
      <LinkManager
        links={mockLinks}
        onAddLink={mockOnAddLink}
        onUpdateLink={mockOnUpdateLink}
        onRemoveLink={mockOnRemoveLink}
        onRemoveAllLinks={mockOnRemoveAllLinks}
      />
    ));

    const removeButtons = screen.getAllByText("Remove");
    expect(removeButtons).toHaveLength(3);
  });

  it("should have correct accessibility labels", () => {
    render(() => (
      <LinkManager
        links={[]}
        onAddLink={mockOnAddLink}
        onUpdateLink={mockOnUpdateLink}
        onRemoveLink={mockOnRemoveLink}
        onRemoveAllLinks={mockOnRemoveAllLinks}
      />
    ));

    expect(screen.getByText("Links (optional)")).toBeInTheDocument();
    expect(screen.getByText("+ Add Link")).toBeInTheDocument();
  });

  it("should have URL input with type='url'", () => {
    const mockLinks: LinkItem[] = [
      createMockLink("https://example.com", "Example site"),
    ];

    render(() => (
      <LinkManager
        links={mockLinks}
        onAddLink={mockOnAddLink}
        onUpdateLink={mockOnUpdateLink}
        onRemoveLink={mockOnRemoveLink}
        onRemoveAllLinks={mockOnRemoveAllLinks}
      />
    ));

    const urlInput = screen.getByPlaceholderText(
      "Enter website URL",
    ) as HTMLInputElement;
    expect(urlInput.type).toBe("url");
  });

  it("should mark URL input as required", () => {
    const mockLinks: LinkItem[] = [
      createMockLink("https://example.com", "Example site"),
    ];

    render(() => (
      <LinkManager
        links={mockLinks}
        onAddLink={mockOnAddLink}
        onUpdateLink={mockOnUpdateLink}
        onRemoveLink={mockOnRemoveLink}
        onRemoveAllLinks={mockOnRemoveAllLinks}
      />
    ));

    const urlInput = screen.getByPlaceholderText(
      "Enter website URL",
    ) as HTMLInputElement;
    expect(urlInput.required).toBe(true);
  });
});
