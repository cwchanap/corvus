import { describe, it, expect } from "vitest";
import { render, screen } from "@solidjs/testing-library";
import { Badge } from "../src/badge";

describe("Badge", () => {
  it("renders children", () => {
    render(() => <Badge>New</Badge>);
    expect(screen.getByText("New")).toBeInTheDocument();
  });

  it("renders as a div element", () => {
    const { container } = render(() => <Badge>Label</Badge>);
    expect(container.querySelector("div")).toBeInTheDocument();
  });

  it("applies default variant classes", () => {
    const { container } = render(() => <Badge>Default</Badge>);
    expect(container.querySelector("div")!.className).toContain("bg-primary");
  });

  it("applies secondary variant", () => {
    const { container } = render(() => (
      <Badge variant="secondary">Secondary</Badge>
    ));
    expect(container.querySelector("div")!.className).toContain("bg-secondary");
  });

  it("applies destructive variant", () => {
    const { container } = render(() => (
      <Badge variant="destructive">Error</Badge>
    ));
    expect(container.querySelector("div")!.className).toContain(
      "bg-destructive",
    );
  });

  it("applies outline variant", () => {
    const { container } = render(() => (
      <Badge variant="outline">Outline</Badge>
    ));
    expect(container.querySelector("div")!.className).toContain(
      "text-foreground",
    );
  });

  it("merges custom class", () => {
    const { container } = render(() => (
      <Badge class="extra-class">Custom</Badge>
    ));
    expect(container.querySelector("div")!.className).toContain("extra-class");
  });

  it("passes through HTML attributes", () => {
    const { container } = render(() => (
      <Badge data-testid="my-badge">Badge</Badge>
    ));
    expect(
      container.querySelector('[data-testid="my-badge"]'),
    ).toBeInTheDocument();
  });
});
