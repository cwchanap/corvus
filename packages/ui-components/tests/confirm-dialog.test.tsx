import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@solidjs/testing-library";
import { ConfirmDialog } from "../src/confirm-dialog";

describe("ConfirmDialog", () => {
  let onOpenChange: ReturnType<typeof vi.fn>;
  let onConfirm: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onOpenChange = vi.fn();
    onConfirm = vi.fn();
  });

  const defaultProps = () => ({
    open: true,
    onOpenChange,
    onConfirm,
    title: "Confirm Action",
  });

  it("renders nothing when closed", () => {
    render(() => (
      <ConfirmDialog {...defaultProps()} open={false} title="Hidden" />
    ));
    expect(screen.queryByText("Hidden")).not.toBeInTheDocument();
  });

  it("renders title when open", () => {
    render(() => <ConfirmDialog {...defaultProps()} />);
    expect(screen.getByText("Confirm Action")).toBeInTheDocument();
  });

  it("renders description when provided", () => {
    render(() => (
      <ConfirmDialog {...defaultProps()} description="Are you sure?" />
    ));
    expect(screen.getByText("Are you sure?")).toBeInTheDocument();
  });

  it("does not render description when not provided", () => {
    render(() => <ConfirmDialog {...defaultProps()} />);
    expect(screen.queryByText("Are you sure?")).not.toBeInTheDocument();
  });

  it("renders children content when provided", () => {
    render(() => (
      <ConfirmDialog {...defaultProps()}>
        <span>Custom child content</span>
      </ConfirmDialog>
    ));
    expect(screen.getByText("Custom child content")).toBeInTheDocument();
  });

  it("renders Cancel button with default text", () => {
    render(() => <ConfirmDialog {...defaultProps()} />);
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
  });

  it("renders Confirm button with default text", () => {
    render(() => <ConfirmDialog {...defaultProps()} />);
    expect(screen.getByRole("button", { name: "Confirm" })).toBeInTheDocument();
  });

  it("renders custom confirmText", () => {
    render(() => <ConfirmDialog {...defaultProps()} confirmText="Delete" />);
    expect(screen.getByRole("button", { name: "Delete" })).toBeInTheDocument();
  });

  it("renders custom cancelText", () => {
    render(() => <ConfirmDialog {...defaultProps()} cancelText="Go back" />);
    expect(screen.getByRole("button", { name: "Go back" })).toBeInTheDocument();
  });

  it("calls onConfirm and closes when confirm button clicked", () => {
    render(() => <ConfirmDialog {...defaultProps()} confirmText="Yes" />);
    fireEvent.click(screen.getByRole("button", { name: "Yes" }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("calls onOpenChange(false) when Cancel clicked", () => {
    render(() => <ConfirmDialog {...defaultProps()} />);
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("calls onOpenChange(false) when backdrop is clicked", () => {
    render(() => <ConfirmDialog {...defaultProps()} />);
    const backdrop = screen.getByTestId("confirm-dialog-backdrop");
    fireEvent.click(backdrop);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("applies destructive variant by default to confirm button", () => {
    render(() => <ConfirmDialog {...defaultProps()} />);
    const confirmBtn = screen.getByRole("button", { name: "Confirm" });
    expect(confirmBtn.className).toContain("bg-destructive");
  });

  it("applies default variant when specified", () => {
    render(() => <ConfirmDialog {...defaultProps()} variant="default" />);
    const confirmBtn = screen.getByRole("button", { name: "Confirm" });
    expect(confirmBtn.className).toContain("bg-primary");
  });
});
