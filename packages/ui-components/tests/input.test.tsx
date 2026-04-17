import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@solidjs/testing-library";
import { Input } from "../src/input";

describe("Input", () => {
  it("renders an input element", () => {
    render(() => <Input />);
    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });

  it("renders with placeholder", () => {
    render(() => <Input placeholder="Search..." />);
    expect(screen.getByPlaceholderText("Search...")).toBeInTheDocument();
  });

  it("applies base styling classes", () => {
    const { container } = render(() => <Input />);
    const input = container.querySelector("input")!;
    expect(input.className).toContain("rounded-md");
    expect(input.className).toContain("border");
  });

  it("merges custom class", () => {
    const { container } = render(() => <Input class="custom-input" />);
    expect(container.querySelector("input")!.className).toContain(
      "custom-input",
    );
  });

  it("accepts value attribute", () => {
    render(() => <Input value="hello" readOnly />);
    expect(screen.getByDisplayValue("hello")).toBeInTheDocument();
  });

  it("calls onInput when user types", () => {
    const handleInput = vi.fn();
    render(() => <Input onInput={handleInput} />);
    const input = screen.getByRole("textbox");
    fireEvent.input(input, { target: { value: "test" } });
    expect(handleInput).toHaveBeenCalledTimes(1);
  });

  it("can be disabled", () => {
    render(() => <Input disabled />);
    expect(screen.getByRole("textbox")).toBeDisabled();
  });

  it("accepts type attribute", () => {
    const { container } = render(() => <Input type="email" />);
    expect(container.querySelector("input")).toHaveAttribute("type", "email");
  });

  it("passes through HTML attributes", () => {
    render(() => <Input aria-label="search field" />);
    expect(screen.getByRole("textbox")).toHaveAttribute(
      "aria-label",
      "search field",
    );
  });
});
