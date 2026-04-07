import "@testing-library/jest-dom/vitest";

// vitest's populateGlobal skips localStorage/sessionStorage because they are
// defined as getters on Window.prototype (not own properties of the window
// object), so Bun's broken built-in localStorage leaks into the test global.
// Explicitly forward them to jsdom's implementations via the dom instance
// that vitest stores as globalThis.jsdom.
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
