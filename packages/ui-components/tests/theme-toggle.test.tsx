import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@solidjs/testing-library";
import { ThemeToggle } from "../src/theme-toggle";

describe("ThemeToggle", () => {
  it("renders a button", () => {
    render(() => (
      <ThemeToggle
        theme={() => "light"}
        setTheme={vi.fn()}
        resolvedTheme={() => "light"}
      />
    ));
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("shows sun icon when resolved theme is light", () => {
    render(() => (
      <ThemeToggle
        theme={() => "light"}
        setTheme={vi.fn()}
        resolvedTheme={() => "light"}
      />
    ));
    expect(screen.getByText("☀️")).toBeInTheDocument();
  });

  it("shows moon icon when resolved theme is dark", () => {
    render(() => (
      <ThemeToggle
        theme={() => "dark"}
        setTheme={vi.fn()}
        resolvedTheme={() => "dark"}
      />
    ));
    expect(screen.getByText("🌙")).toBeInTheDocument();
  });

  it("shows Light label in title when resolved theme is light", () => {
    render(() => (
      <ThemeToggle
        theme={() => "light"}
        setTheme={vi.fn()}
        resolvedTheme={() => "light"}
      />
    ));
    expect(screen.getByTitle(/Light/)).toBeInTheDocument();
  });

  it("shows Dark label in title when resolved theme is dark", () => {
    render(() => (
      <ThemeToggle
        theme={() => "dark"}
        setTheme={vi.fn()}
        resolvedTheme={() => "dark"}
      />
    ));
    expect(screen.getByTitle(/Dark/)).toBeInTheDocument();
  });

  it("calls setTheme('dark') when light and clicked", () => {
    const setTheme = vi.fn();
    render(() => (
      <ThemeToggle
        theme={() => "light"}
        setTheme={setTheme}
        resolvedTheme={() => "light"}
      />
    ));
    fireEvent.click(screen.getByRole("button"));
    expect(setTheme).toHaveBeenCalledWith("dark");
  });

  it("calls setTheme('light') when dark and clicked", () => {
    const setTheme = vi.fn();
    render(() => (
      <ThemeToggle
        theme={() => "dark"}
        setTheme={setTheme}
        resolvedTheme={() => "dark"}
      />
    ));
    fireEvent.click(screen.getByRole("button"));
    expect(setTheme).toHaveBeenCalledWith("light");
  });
});
