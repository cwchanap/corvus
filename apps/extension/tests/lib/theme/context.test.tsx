import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@solidjs/testing-library";
import { ThemeProvider, useTheme } from "../../../src/lib/theme/context";

vi.mock("../../../src/lib/theme/init-styles", () => ({
  applyThemeVariables: vi.fn(),
}));

import { applyThemeVariables } from "../../../src/lib/theme/init-styles";
const mockedApply = vi.mocked(applyThemeVariables);

const mockMatchMedia = vi.fn().mockImplementation((query: string) => ({
  matches: false,
  media: query,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
}));

Object.defineProperty(window, "matchMedia", {
  writable: true,
  configurable: true,
  value: mockMatchMedia,
});

beforeEach(() => {
  // Reset chrome.storage mock to return empty result
  (chrome.storage.local.get as ReturnType<typeof vi.fn>).mockImplementation(
    (_keys: unknown, callback: (result: Record<string, unknown>) => void) => {
      callback({});
    },
  );
  (chrome.storage.local.set as ReturnType<typeof vi.fn>).mockClear();
  document.documentElement.classList.remove("dark");
  mockMatchMedia.mockImplementation((query: string) => ({
    matches: false,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
  mockedApply.mockClear();
});

afterEach(() => {
  cleanup();
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

  it("persists theme to chrome.storage.local when theme changes", () => {
    render(() => (
      <ThemeProvider defaultTheme="light">
        <Consumer />
      </ThemeProvider>
    ));

    fireEvent.click(screen.getByText("Set Dark"));

    expect(chrome.storage.local.set).toHaveBeenCalledWith({ theme: "dark" });
  });

  it("loads saved theme from chrome.storage.local on mount", () => {
    (chrome.storage.local.get as ReturnType<typeof vi.fn>).mockImplementation(
      (_keys: unknown, callback: (result: Record<string, unknown>) => void) => {
        callback({ theme: "dark" });
      },
    );

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

  it("removes dark class when switching to light", () => {
    document.documentElement.classList.add("dark");

    render(() => (
      <ThemeProvider defaultTheme="light">
        <Consumer />
      </ThemeProvider>
    ));

    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });

  it("resolves system theme to light when system prefers light", () => {
    render(() => (
      <ThemeProvider defaultTheme="system">
        <Consumer />
      </ThemeProvider>
    ));

    expect(screen.getByTestId("resolved").textContent).toBe("light");
  });

  it("calls applyThemeVariables with resolved theme", () => {
    render(() => (
      <ThemeProvider defaultTheme="dark">
        <Consumer />
      </ThemeProvider>
    ));

    expect(mockedApply).toHaveBeenCalledWith("dark");
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

    expect(screen.getByTestId("resolved").textContent).toBe("light");

    expect(capturedHandler).toBeDefined();
    capturedHandler!({ matches: true } as MediaQueryListEvent);

    expect(screen.getByTestId("resolved").textContent).toBe("dark");
  });

  it("updates resolved theme when system preference changes to light", () => {
    let capturedHandler: ((e: MediaQueryListEvent) => void) | null = null;

    mockMatchMedia.mockImplementation((query: string) => ({
      matches: true,
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

    expect(capturedHandler).toBeDefined();
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

  it("sets system theme to dark when matchMedia matches dark", () => {
    mockMatchMedia.mockImplementation((query: string) => ({
      matches: true,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    render(() => (
      <ThemeProvider defaultTheme="system">
        <Consumer />
      </ThemeProvider>
    ));

    expect(screen.getByTestId("resolved").textContent).toBe("dark");
  });
});
