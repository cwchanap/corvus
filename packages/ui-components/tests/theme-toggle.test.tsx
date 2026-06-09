import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@solidjs/testing-library";
import { ThemeToggle } from "../src/theme-toggle";

describe("ThemeToggle", () => {
  it("renders a button", () => {
    render(() => <ThemeToggle theme={() => "light"} setTheme={vi.fn()} />);
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("shows sun icon when theme is light", () => {
    render(() => <ThemeToggle theme={() => "light"} setTheme={vi.fn()} />);
    expect(screen.getByLabelText("Light theme active")).toBeInTheDocument();
  });

  it("shows moon icon when theme is dark", () => {
    render(() => <ThemeToggle theme={() => "dark"} setTheme={vi.fn()} />);
    expect(screen.getByLabelText("Dark theme active")).toBeInTheDocument();
  });

  it("shows monitor icon when theme is system", () => {
    render(() => <ThemeToggle theme={() => "system"} setTheme={vi.fn()} />);
    expect(screen.getByLabelText("System theme active")).toBeInTheDocument();
  });

  it("shows Light label in title when theme is light", () => {
    render(() => <ThemeToggle theme={() => "light"} setTheme={vi.fn()} />);
    expect(screen.getByTitle(/Light/)).toBeInTheDocument();
  });

  it("shows Dark label in title when theme is dark", () => {
    render(() => <ThemeToggle theme={() => "dark"} setTheme={vi.fn()} />);
    expect(screen.getByTitle(/Dark/)).toBeInTheDocument();
  });

  it("shows System label in title when theme is system", () => {
    render(() => <ThemeToggle theme={() => "system"} setTheme={vi.fn()} />);
    expect(screen.getByTitle(/System/)).toBeInTheDocument();
  });

  it("cycles system → light when clicked", () => {
    const setTheme = vi.fn();
    render(() => <ThemeToggle theme={() => "system"} setTheme={setTheme} />);
    fireEvent.click(screen.getByRole("button"));
    expect(setTheme).toHaveBeenCalledWith("light");
  });

  it("cycles light → dark when clicked", () => {
    const setTheme = vi.fn();
    render(() => <ThemeToggle theme={() => "light"} setTheme={setTheme} />);
    fireEvent.click(screen.getByRole("button"));
    expect(setTheme).toHaveBeenCalledWith("dark");
  });

  it("cycles dark → system when clicked", () => {
    const setTheme = vi.fn();
    render(() => <ThemeToggle theme={() => "dark"} setTheme={setTheme} />);
    fireEvent.click(screen.getByRole("button"));
    expect(setTheme).toHaveBeenCalledWith("system");
  });
});
