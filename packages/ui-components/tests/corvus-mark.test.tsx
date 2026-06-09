import { render, screen } from "@solidjs/testing-library";
import { describe, it, expect } from "vitest";
import { CorvusMark, FeatherMark } from "../src/corvus-mark";

describe("CorvusMark", () => {
  it("renders an accessible constellation mark", () => {
    render(() => <CorvusMark title="Corvus" />);
    expect(screen.getByRole("img", { name: "Corvus" })).toBeInTheDocument();
  });

  it("renders as decorative when no title is provided", () => {
    const { container } = render(() => <CorvusMark />);
    const svg = container.querySelector("svg");
    expect(svg).not.toBeNull();
    expect(svg?.getAttribute("aria-hidden")).toBe("true");
    expect(svg?.getAttribute("role")).toBeNull();
    expect(screen.queryByRole("img")).toBeNull();
  });
});

describe("FeatherMark", () => {
  it("renders a decorative feather (aria-hidden)", () => {
    const { container } = render(() => <FeatherMark />);
    const svg = container.querySelector("svg");
    expect(svg).not.toBeNull();
    expect(svg?.getAttribute("aria-hidden")).toBe("true");
  });
});
