import { describe, it, expect } from "vitest";
import { render, screen } from "@solidjs/testing-library";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "../src/card";

describe("Card", () => {
  it("renders children", () => {
    render(() => <Card>Card content</Card>);
    expect(screen.getByText("Card content")).toBeInTheDocument();
  });

  it("applies card base classes", () => {
    const { container } = render(() => <Card>Content</Card>);
    expect(container.querySelector("div")!.className).toContain("rounded-lg");
  });

  it("merges custom class", () => {
    const { container } = render(() => <Card class="my-card">Content</Card>);
    expect(container.querySelector("div")!.className).toContain("my-card");
  });

  it("passes through HTML attributes", () => {
    const { container } = render(() => <Card data-testid="card">Content</Card>);
    expect(container.querySelector('[data-testid="card"]')).toBeInTheDocument();
  });
});

describe("CardHeader", () => {
  it("renders children", () => {
    render(() => <CardHeader>Header</CardHeader>);
    expect(screen.getByText("Header")).toBeInTheDocument();
  });

  it("applies flex column layout class", () => {
    const { container } = render(() => <CardHeader>H</CardHeader>);
    expect(container.querySelector("div")!.className).toContain("flex-col");
  });

  it("merges custom class", () => {
    const { container } = render(() => (
      <CardHeader class="extra">H</CardHeader>
    ));
    expect(container.querySelector("div")!.className).toContain("extra");
  });
});

describe("CardTitle", () => {
  it("renders as h3", () => {
    render(() => <CardTitle>Title</CardTitle>);
    expect(screen.getByRole("heading", { level: 3 })).toBeInTheDocument();
  });

  it("renders text content", () => {
    render(() => <CardTitle>My Title</CardTitle>);
    expect(screen.getByText("My Title")).toBeInTheDocument();
  });

  it("merges custom class", () => {
    const { container } = render(() => (
      <CardTitle class="custom-title">T</CardTitle>
    ));
    expect(container.querySelector("h3")!.className).toContain("custom-title");
  });
});

describe("CardDescription", () => {
  it("renders as p", () => {
    const { container } = render(() => <CardDescription>Desc</CardDescription>);
    expect(container.querySelector("p")).toBeInTheDocument();
  });

  it("renders text content", () => {
    render(() => <CardDescription>Some description</CardDescription>);
    expect(screen.getByText("Some description")).toBeInTheDocument();
  });

  it("applies muted-foreground class", () => {
    const { container } = render(() => <CardDescription>D</CardDescription>);
    expect(container.querySelector("p")!.className).toContain(
      "text-muted-foreground",
    );
  });
});

describe("CardContent", () => {
  it("renders children", () => {
    render(() => <CardContent>Body text</CardContent>);
    expect(screen.getByText("Body text")).toBeInTheDocument();
  });

  it("applies padding class", () => {
    const { container } = render(() => <CardContent>C</CardContent>);
    expect(container.querySelector("div")!.className).toContain("p-6");
  });

  it("merges custom class", () => {
    const { container } = render(() => (
      <CardContent class="custom-content">C</CardContent>
    ));
    expect(container.querySelector("div")!.className).toContain(
      "custom-content",
    );
  });
});

describe("CardFooter", () => {
  it("renders children", () => {
    render(() => <CardFooter>Footer</CardFooter>);
    expect(screen.getByText("Footer")).toBeInTheDocument();
  });

  it("applies flex layout class", () => {
    const { container } = render(() => <CardFooter>F</CardFooter>);
    expect(container.querySelector("div")!.className).toContain("flex");
  });

  it("merges custom class", () => {
    const { container } = render(() => (
      <CardFooter class="my-footer">F</CardFooter>
    ));
    expect(container.querySelector("div")!.className).toContain("my-footer");
  });
});
