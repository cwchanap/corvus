import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

// Mock chrome extension APIs
const chromeMock = {
  storage: {
    local: {
      get: vi.fn((_keys: unknown, callback: (result: Record<string, unknown>) => void) => {
        callback({});
      }),
      set: vi.fn(),
    },
  },
  tabs: {
    create: vi.fn(),
  },
};

Object.defineProperty(globalThis, "chrome", {
  value: chromeMock,
  writable: true,
  configurable: true,
});

// Mock matchMedia (not available in jsdom)
Object.defineProperty(window, "matchMedia", {
  writable: true,
  configurable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Fix localStorage/sessionStorage forwarding for jsdom
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const dom = (globalThis as any).jsdom;
if (dom?.window) {
  Object.defineProperty(globalThis, "localStorage", {
    get: () => dom.window.localStorage,
    configurable: true,
  });
  Object.defineProperty(globalThis, "sessionStorage", {
    get: () => dom.window.sessionStorage,
    configurable: true,
  });
}
