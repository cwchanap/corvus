import { render, screen } from "@solidjs/testing-library";
import { describe, it, expect } from "vitest";
import { CorvusMark, FeatherMark } from "../src/corvus-mark";

describe("CorvusMark", () => {
  it("renders an accessible constellation mark", () => {
    render(() => <CorvusMark title="Corvus" />);
    expect(screen.getByRole("img", { name: "Corvus" })).toBeInTheDocument();
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
