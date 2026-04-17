import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@solidjs/testing-library";
import { Button } from "../src/button";

describe("Button", () => {
  it("renders children", () => {
    render(() => <Button>Click me</Button>);
    expect(screen.getByText("Click me")).toBeInTheDocument();
  });

  it("renders as a button element", () => {
    render(() => <Button>Submit</Button>);
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("defaults to type=button", () => {
    render(() => <Button>Btn</Button>);
    expect(screen.getByRole("button")).toHaveAttribute("type", "button");
  });

  it("accepts explicit type attribute", () => {
    render(() => <Button type="submit">Submit</Button>);
    expect(screen.getByRole("button")).toHaveAttribute("type", "submit");
  });

  it("calls onClick when clicked", () => {
    const handleClick = vi.fn();
    render(() => <Button onClick={handleClick}>Click</Button>);
    fireEvent.click(screen.getByRole("button"));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("renders with default variant classes", () => {
    const { container } = render(() => <Button>Default</Button>);
    const btn = container.querySelector("button")!;
    expect(btn.className).toContain("bg-primary");
  });

  it("renders with destructive variant", () => {
    const { container } = render(() => (
      <Button variant="destructive">Delete</Button>
    ));
    expect(container.querySelector("button")!.className).toContain(
      "bg-destructive",
    );
  });

  it("renders with outline variant", () => {
    const { container } = render(() => (
      <Button variant="outline">Outline</Button>
    ));
    expect(container.querySelector("button")!.className).toContain("border");
  });

  it("renders with secondary variant", () => {
    const { container } = render(() => (
      <Button variant="secondary">Secondary</Button>
    ));
    expect(container.querySelector("button")!.className).toContain(
      "bg-secondary",
    );
  });

  it("renders with ghost variant", () => {
    const { container } = render(() => <Button variant="ghost">Ghost</Button>);
    expect(container.querySelector("button")!.className).toContain(
      "hover:bg-accent",
    );
  });

  it("renders with link variant", () => {
    const { container } = render(() => <Button variant="link">Link</Button>);
    expect(container.querySelector("button")!.className).toContain(
      "text-primary",
    );
  });

  it("renders with sm size", () => {
    const { container } = render(() => <Button size="sm">Small</Button>);
    expect(container.querySelector("button")!.className).toContain("h-9");
  });

  it("renders with lg size", () => {
    const { container } = render(() => <Button size="lg">Large</Button>);
    expect(container.querySelector("button")!.className).toContain("h-11");
  });

  it("renders with icon size", () => {
    const { container } = render(() => <Button size="icon">+</Button>);
    expect(container.querySelector("button")!.className).toContain("w-10");
  });

  it("merges custom class with variant classes", () => {
    const { container } = render(() => (
      <Button class="my-custom-class">Styled</Button>
    ));
    expect(container.querySelector("button")!.className).toContain(
      "my-custom-class",
    );
  });

  it("can be disabled", () => {
    render(() => <Button disabled>Disabled</Button>);
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("passes through additional HTML attributes", () => {
    render(() => <Button aria-label="action button">Action</Button>);
    expect(screen.getByRole("button")).toHaveAttribute(
      "aria-label",
      "action button",
    );
  });
});
