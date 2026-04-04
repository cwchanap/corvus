import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@solidjs/testing-library";
import { ThemeProvider, useTheme } from "./context";

// Mock matchMedia globally
const mockMatchMedia = vi.fn().mockImplementation((query: string) => ({
  matches: false, // default: system prefers light
  media: query,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
}));

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: mockMatchMedia,
});

beforeEach(() => {
  // Reset localStorage mock
  vi.spyOn(Storage.prototype, "getItem").mockReturnValue(null);
  vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => undefined);
  // Reset document class
  document.documentElement.classList.remove("dark");
  // Reset matchMedia mock
  mockMatchMedia.mockImplementation((query: string) => ({
    matches: false,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  document.documentElement.classList.remove("dark");
});

function Consumer() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  return (
    <div>
      <span data-testid="theme">{theme()}</span>
      <span data-testid="resolved">{resolvedTheme()}</span>
      <button onClick={() => setTheme("dark")}>Set Dark</button>
      <button onClick={() => setTheme("light")}>Set Light</button>
      <button onClick={() => setTheme("system")}>Set System</button>
    </div>
  );
}

describe("ThemeProvider", () => {
  it("defaults to system theme", () => {
    render(() => (
      <ThemeProvider>
        <Consumer />
      </ThemeProvider>
    ));

    expect(screen.getByTestId("theme").textContent).toBe("system");
  });

  it("uses defaultTheme prop when provided", () => {
    render(() => (
      <ThemeProvider defaultTheme="dark">
        <Consumer />
      </ThemeProvider>
    ));

    expect(screen.getByTestId("theme").textContent).toBe("dark");
  });

  it("sets dark theme when setTheme is called with dark", () => {
    render(() => (
      <ThemeProvider defaultTheme="light">
        <Consumer />
      </ThemeProvider>
    ));

    fireEvent.click(screen.getByText("Set Dark"));

    expect(screen.getByTestId("theme").textContent).toBe("dark");
    expect(screen.getByTestId("resolved").textContent).toBe("dark");
  });

  it("sets light theme when setTheme is called with light", () => {
    render(() => (
      <ThemeProvider defaultTheme="dark">
        <Consumer />
      </ThemeProvider>
    ));

    fireEvent.click(screen.getByText("Set Light"));

    expect(screen.getByTestId("theme").textContent).toBe("light");
    expect(screen.getByTestId("resolved").textContent).toBe("light");
  });

  it("persists theme to localStorage when theme changes", () => {
    render(() => (
      <ThemeProvider defaultTheme="light">
        <Consumer />
      </ThemeProvider>
    ));

    fireEvent.click(screen.getByText("Set Dark"));

    expect(Storage.prototype.setItem).toHaveBeenCalledWith("theme", "dark");
  });

  it("loads saved theme from localStorage on mount", () => {
    vi.spyOn(Storage.prototype, "getItem").mockReturnValue("dark");

    render(() => (
      <ThemeProvider>
        <Consumer />
      </ThemeProvider>
    ));

    expect(screen.getByTestId("theme").textContent).toBe("dark");
  });

  it("adds dark class to document when theme is dark", () => {
    render(() => (
      <ThemeProvider defaultTheme="dark">
        <Consumer />
      </ThemeProvider>
    ));

    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("removes dark class from document when theme is light", () => {
    document.documentElement.classList.add("dark");

    render(() => (
      <ThemeProvider defaultTheme="light">
        <Consumer />
      </ThemeProvider>
    ));

    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });

  it("resolves system theme to light when system prefers light", () => {
    // matchMedia already returns matches: false (light) by default
    render(() => (
      <ThemeProvider defaultTheme="system">
        <Consumer />
      </ThemeProvider>
    ));

    expect(screen.getByTestId("resolved").textContent).toBe("light");
  });

  it("renders children", () => {
    render(() => (
      <ThemeProvider>
        <div data-testid="child">Child content</div>
      </ThemeProvider>
    ));

    expect(screen.getByTestId("child")).toBeInTheDocument();
  });
});

describe("useTheme", () => {
  it("throws when used outside of ThemeProvider", () => {
    function ConsumerWithoutProvider() {
      useTheme();
      return <div />;
    }

    expect(() => {
      render(() => <ConsumerWithoutProvider />);
    }).toThrow("useTheme must be used within a ThemeProvider");
  });
});

describe("ThemeProvider – system theme change listener", () => {
  it("updates resolved theme when system preference changes to dark", () => {
    let capturedHandler: ((e: MediaQueryListEvent) => void) | null = null;

    mockMatchMedia.mockImplementation((query: string) => ({
      matches: false,
      media: query,
      addEventListener: vi.fn(
        (_event: string, handler: (e: MediaQueryListEvent) => void) => {
          capturedHandler = handler;
        },
      ),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    render(() => (
      <ThemeProvider defaultTheme="system">
        <Consumer />
      </ThemeProvider>
    ));

    // Initially resolved to light (matches: false)
    expect(screen.getByTestId("resolved").textContent).toBe("light");

    // Simulate system preference switching to dark
    capturedHandler!({ matches: true } as MediaQueryListEvent);

    expect(screen.getByTestId("resolved").textContent).toBe("dark");
  });

  it("updates resolved theme when system preference changes to light", () => {
    let capturedHandler: ((e: MediaQueryListEvent) => void) | null = null;

    mockMatchMedia.mockImplementation((query: string) => ({
      matches: true, // starts dark
      media: query,
      addEventListener: vi.fn(
        (_event: string, handler: (e: MediaQueryListEvent) => void) => {
          capturedHandler = handler;
        },
      ),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    render(() => (
      <ThemeProvider defaultTheme="system">
        <Consumer />
      </ThemeProvider>
    ));

    expect(screen.getByTestId("resolved").textContent).toBe("dark");

    capturedHandler!({ matches: false } as MediaQueryListEvent);

    expect(screen.getByTestId("resolved").textContent).toBe("light");
  });

  it("registers a change event listener on the matchMedia object", () => {
    const mockAddEventListener = vi.fn();

    mockMatchMedia.mockImplementation((query: string) => ({
      matches: false,
      media: query,
      addEventListener: mockAddEventListener,
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    render(() => (
      <ThemeProvider>
        <Consumer />
      </ThemeProvider>
    ));

    expect(mockAddEventListener).toHaveBeenCalledWith(
      "change",
      expect.any(Function),
    );
  });
});
