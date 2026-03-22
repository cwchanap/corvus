import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getCurrentPageInfo } from "../src/utils/page-info";

// ---------------------------------------------------------------------------
// Helpers to manipulate globalThis.chrome and window
// ---------------------------------------------------------------------------
type ChromeLike = {
    tabs?: {
        query(q: {
            active: boolean;
            currentWindow: boolean;
        }): Promise<{ title?: string; url?: string; favIconUrl?: string }[]>;
    };
};

function stubChrome(chrome: ChromeLike | undefined) {
    (globalThis as Record<string, unknown>).chrome = chrome;
}

function removeChrome() {
    delete (globalThis as Record<string, unknown>).chrome;
}

// ---------------------------------------------------------------------------
// Extension context (chrome.tabs available)
// ---------------------------------------------------------------------------
describe("getCurrentPageInfo – extension context", () => {
    afterEach(() => {
        removeChrome();
    });

    it("returns tab info when chrome.tabs.query returns a tab", async () => {
        stubChrome({
            tabs: {
                query: vi.fn().mockResolvedValue([
                    {
                        title: "My Page",
                        url: "https://example.com",
                        favIconUrl: "https://example.com/favicon.ico",
                    },
                ]),
            },
        });

        const info = await getCurrentPageInfo();
        expect(info).toEqual({
            title: "My Page",
            url: "https://example.com",
            favicon: "https://example.com/favicon.ico",
        });
    });

    it("returns fallback title when tab.title is empty", async () => {
        stubChrome({
            tabs: {
                query: vi
                    .fn()
                    .mockResolvedValue([
                        { title: "", url: "https://example.com" },
                    ]),
            },
        });

        const info = await getCurrentPageInfo();
        expect(info.title).toBe("Untitled Page");
    });

    it("returns empty url when tab.url is undefined", async () => {
        stubChrome({
            tabs: {
                query: vi
                    .fn()
                    .mockResolvedValue([{ title: "Page", url: undefined }]),
            },
        });

        const info = await getCurrentPageInfo();
        expect(info.url).toBe("");
    });

    it("falls through to window fallback when chrome.tabs.query returns empty array", async () => {
        stubChrome({
            tabs: {
                query: vi.fn().mockResolvedValue([]),
            },
        });

        // In node environment window is undefined → hits the error fallback
        const info = await getCurrentPageInfo();
        expect(info.title).toBe("Unknown Page");
    });
});

// ---------------------------------------------------------------------------
// Web context (no chrome, window defined)
// ---------------------------------------------------------------------------
describe("getCurrentPageInfo – web context", () => {
    beforeEach(() => {
        removeChrome();
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it("returns page info from document/window in a web environment", async () => {
        vi.stubGlobal("window", {
            location: { href: "https://web.example.com/page" },
        });
        vi.stubGlobal("document", {
            title: "Web Page",
            querySelector: () => null,
        });

        const info = await getCurrentPageInfo();
        expect(info.title).toBe("Web Page");
        expect(info.url).toBe("https://web.example.com/page");
    });

    it("uses 'Untitled Page' when document.title is empty", async () => {
        vi.stubGlobal("window", {
            location: { href: "https://web.example.com/" },
        });
        vi.stubGlobal("document", {
            title: "",
            querySelector: () => null,
        });

        const info = await getCurrentPageInfo();
        expect(info.title).toBe("Untitled Page");
    });

    it("returns favicon from a <link rel='icon'> element", async () => {
        vi.stubGlobal("window", {
            location: {
                href: "https://web.example.com/",
                protocol: "https:",
                hostname: "web.example.com",
                port: "",
            },
        });
        vi.stubGlobal("document", {
            title: "Page",
            querySelector: () => ({ href: "https://web.example.com/icon.png" }),
        });

        const info = await getCurrentPageInfo();
        expect(info.favicon).toBe("https://web.example.com/icon.png");
    });

    it("falls back to /favicon.ico when no <link rel='icon'> found", async () => {
        vi.stubGlobal("window", {
            location: {
                href: "https://web.example.com/",
                protocol: "https:",
                hostname: "web.example.com",
                port: "8080",
            },
        });
        vi.stubGlobal("document", {
            title: "Page",
            querySelector: () => null,
        });

        const info = await getCurrentPageInfo();
        expect(info.favicon).toBe("https://web.example.com:8080/favicon.ico");
    });

    it("omits port suffix when port is empty string", async () => {
        vi.stubGlobal("window", {
            location: {
                href: "https://web.example.com/",
                protocol: "https:",
                hostname: "web.example.com",
                port: "",
            },
        });
        vi.stubGlobal("document", {
            title: "Page",
            querySelector: () => null,
        });

        const info = await getCurrentPageInfo();
        expect(info.favicon).toBe("https://web.example.com/favicon.ico");
    });

    it("returns undefined favicon when document is not defined in a web context", async () => {
        // window is defined but document is NOT → favicon should be reported as undefined
        vi.stubGlobal("window", {
            location: { href: "https://web.example.com/" },
        });
        // document is intentionally not stubbed → typeof document === "undefined"

        const info = await getCurrentPageInfo();
        expect(info.title).toBeDefined();
        expect(info.favicon).toBeUndefined();
    });
});

// ---------------------------------------------------------------------------
// Error fallback path
// ---------------------------------------------------------------------------
describe("getCurrentPageInfo – error fallback", () => {
    afterEach(() => {
        removeChrome();
        vi.unstubAllGlobals();
    });

    it("returns Unknown Page when neither chrome nor window is available", async () => {
        removeChrome();
        // In the Node test environment window is already undefined
        const info = await getCurrentPageInfo();
        expect(info.title).toBe("Unknown Page");
        expect(info.url).toBe("");
    });

    it("catches errors from chrome.tabs.query and returns Unknown Page", async () => {
        stubChrome({
            tabs: {
                query: vi.fn().mockRejectedValue(new Error("Extension error")),
            },
        });

        const info = await getCurrentPageInfo();
        expect(info.title).toBe("Unknown Page");
    });

    it("returns window.location.href in catch fallback when window is defined", async () => {
        // Chrome throws, but window IS defined → url comes from window.location.href
        stubChrome({
            tabs: {
                query: vi.fn().mockRejectedValue(new Error("tabs failed")),
            },
        });
        vi.stubGlobal("window", {
            location: { href: "https://fallback.example.com/" },
        });

        const info = await getCurrentPageInfo();
        expect(info.title).toBe("Unknown Page");
        expect(info.url).toBe("https://fallback.example.com/");
    });

    it("returns empty url in catch fallback when window.location.href is empty", async () => {
        stubChrome({
            tabs: {
                query: vi.fn().mockRejectedValue(new Error("tabs failed")),
            },
        });
        vi.stubGlobal("window", {
            location: { href: "" }, // falsy → || "" fallback
        });

        const info = await getCurrentPageInfo();
        expect(info.title).toBe("Unknown Page");
        expect(info.url).toBe("");
    });
});
