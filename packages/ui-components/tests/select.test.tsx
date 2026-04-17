import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@solidjs/testing-library";
import { Select } from "../src/select";

describe("Select", () => {
  it("renders a select element", () => {
    render(() => <Select />);
    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });

  it("renders options from options prop", () => {
    const options = [
      { value: "a", label: "Option A" },
      { value: "b", label: "Option B" },
    ];
    render(() => <Select options={options} />);
    expect(screen.getByText("Option A")).toBeInTheDocument();
    expect(screen.getByText("Option B")).toBeInTheDocument();
  });

  it("sets correct value on option elements", () => {
    const options = [{ value: "val1", label: "Label 1" }];
    const { container } = render(() => <Select options={options} />);
    const option = container.querySelector("option")!;
    expect(option).toHaveAttribute("value", "val1");
  });

  it("renders children alongside options prop", () => {
    render(() => (
      <Select options={[{ value: "b", label: "B" }]}>
        <option value="a">A</option>
      </Select>
    ));
    expect(screen.getByText("A")).toBeInTheDocument();
    expect(screen.getByText("B")).toBeInTheDocument();
  });

  it("applies base styling classes", () => {
    const { container } = render(() => <Select />);
    const select = container.querySelector("select")!;
    expect(select.className).toContain("rounded-md");
    expect(select.className).toContain("border");
  });

  it("merges custom class", () => {
    const { container } = render(() => <Select class="my-select" />);
    expect(container.querySelector("select")!.className).toContain("my-select");
  });

  it("calls onChange when selection changes", () => {
    const handleChange = vi.fn();
    const options = [
      { value: "a", label: "A" },
      { value: "b", label: "B" },
    ];
    render(() => <Select options={options} onChange={handleChange} />);
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "b" } });
    expect(handleChange).toHaveBeenCalledTimes(1);
  });

  it("can be disabled", () => {
    render(() => <Select disabled />);
    expect(screen.getByRole("combobox")).toBeDisabled();
  });

  it("works with no options", () => {
    render(() => <Select />);
    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });
});
