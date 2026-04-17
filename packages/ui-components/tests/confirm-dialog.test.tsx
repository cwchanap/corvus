import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@solidjs/testing-library";
import { ConfirmDialog } from "../src/confirm-dialog";

describe("ConfirmDialog", () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    onConfirm: vi.fn(),
    title: "Confirm Action",
  };

  it("renders nothing when closed", () => {
    render(() => (
      <ConfirmDialog {...defaultProps} open={false} title="Hidden" />
    ));
    expect(screen.queryByText("Hidden")).not.toBeInTheDocument();
  });

  it("renders title when open", () => {
    render(() => <ConfirmDialog {...defaultProps} />);
    expect(screen.getByText("Confirm Action")).toBeInTheDocument();
  });

  it("renders description when provided", () => {
    render(() => (
      <ConfirmDialog {...defaultProps} description="Are you sure?" />
    ));
    expect(screen.getByText("Are you sure?")).toBeInTheDocument();
  });

  it("does not render description when not provided", () => {
    render(() => <ConfirmDialog {...defaultProps} />);
    expect(screen.queryByText("Are you sure?")).not.toBeInTheDocument();
  });

  it("renders children content when provided", () => {
    render(() => (
      <ConfirmDialog {...defaultProps}>
        <span>Custom child content</span>
      </ConfirmDialog>
    ));
    expect(screen.getByText("Custom child content")).toBeInTheDocument();
  });

  it("renders Cancel button with default text", () => {
    render(() => <ConfirmDialog {...defaultProps} />);
    expect(screen.getByText("Cancel")).toBeInTheDocument();
  });

  it("renders Confirm button with default text", () => {
    render(() => <ConfirmDialog {...defaultProps} />);
    expect(screen.getByText("Confirm")).toBeInTheDocument();
  });

  it("renders custom confirmText", () => {
    render(() => <ConfirmDialog {...defaultProps} confirmText="Delete" />);
    expect(screen.getByText("Delete")).toBeInTheDocument();
  });

  it("renders custom cancelText", () => {
    render(() => <ConfirmDialog {...defaultProps} cancelText="Go back" />);
    expect(screen.getByText("Go back")).toBeInTheDocument();
  });

  it("calls onConfirm and closes when confirm button clicked", () => {
    const onConfirm = vi.fn();
    const onOpenChange = vi.fn();
    render(() => (
      <ConfirmDialog
        {...defaultProps}
        onConfirm={onConfirm}
        onOpenChange={onOpenChange}
        confirmText="Yes"
      />
    ));
    fireEvent.click(screen.getByText("Yes"));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("calls onOpenChange(false) when Cancel clicked", () => {
    const onOpenChange = vi.fn();
    render(() => (
      <ConfirmDialog {...defaultProps} onOpenChange={onOpenChange} />
    ));
    fireEvent.click(screen.getByText("Cancel"));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("calls onOpenChange(false) when backdrop is clicked", () => {
    const onOpenChange = vi.fn();
    const { container } = render(() => (
      <ConfirmDialog {...defaultProps} onOpenChange={onOpenChange} />
    ));
    const backdrop = container.querySelector(".fixed.inset-0.bg-black\\/50")!;
    fireEvent.click(backdrop);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("applies destructive variant by default to confirm button", () => {
    const { container } = render(() => <ConfirmDialog {...defaultProps} />);
    const buttons = container.querySelectorAll("button");
    const confirmBtn = buttons[buttons.length - 1]!;
    expect(confirmBtn.className).toContain("bg-destructive");
  });

  it("applies default variant when specified", () => {
    const { container } = render(() => (
      <ConfirmDialog {...defaultProps} variant="default" />
    ));
    const buttons = container.querySelectorAll("button");
    const confirmBtn = buttons[buttons.length - 1]!;
    expect(confirmBtn.className).toContain("bg-primary");
  });
});
