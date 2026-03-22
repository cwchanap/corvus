import { describe, it, expect, vi } from "vitest";

// Hoisted mock: createGraphQLHandler is called at module scope in index.tsx,
// so the mock must be available before the import is resolved.
vi.mock("../src/graphql/handler", () => ({
    createGraphQLHandler: vi.fn(
        () => async () =>
            new Response('{"data":{}}', {
                status: 200,
                headers: { "content-type": "application/json" },
            }),
    ),
}));

import app from "../src/index";

type AssetsFetcher = { fetch: ReturnType<typeof vi.fn> };

/** Build a mock ASSETS binding that returns responses in sequence. */
function makeAssets(
    ...responses: { status: number; body?: string }[]
): AssetsFetcher {
    const fetchMock = vi.fn();
    for (const r of responses) {
        fetchMock.mockResolvedValueOnce(
            new Response(r.body ?? "", { status: r.status }),
        );
    }
    // Default to 404 for any additional calls
    fetchMock.mockResolvedValue(new Response("Not Found", { status: 404 }));
    return { fetch: fetchMock };
}

const baseEnv = { DB: {} as unknown };

// ---------------------------------------------------------------------------
// CORS middleware – origin callback branches (lines 18-38 of index.tsx)
// ---------------------------------------------------------------------------
describe("CORS middleware origin handling", () => {
    it("passes through requests with no origin header", async () => {
        const assets = makeAssets({ status: 200, body: "ok" });
        const res = await app.request(
            "https://app.example.com/anything",
            {},
            { ...baseEnv, ASSETS: assets },
        );
        expect(res.status).toBe(200);
    });

    it("reflects http://localhost:* origins", async () => {
        const assets = makeAssets({ status: 200, body: "ok" });
        const res = await app.request(
            "https://app.example.com/anything",
            { headers: { origin: "http://localhost:5173" } },
            { ...baseEnv, ASSETS: assets },
        );
        expect(res.headers.get("access-control-allow-origin")).toBe(
            "http://localhost:5173",
        );
    });

    it("reflects https://localhost:* origins", async () => {
        const assets = makeAssets({ status: 200, body: "ok" });
        const res = await app.request(
            "https://app.example.com/anything",
            { headers: { origin: "https://localhost:8443" } },
            { ...baseEnv, ASSETS: assets },
        );
        expect(res.headers.get("access-control-allow-origin")).toBe(
            "https://localhost:8443",
        );
    });

    it("reflects chrome-extension:// origins", async () => {
        const assets = makeAssets({ status: 200, body: "ok" });
        const res = await app.request(
            "https://app.example.com/anything",
            { headers: { origin: "chrome-extension://exampleid" } },
            { ...baseEnv, ASSETS: assets },
        );
        expect(res.headers.get("access-control-allow-origin")).toBe(
            "chrome-extension://exampleid",
        );
    });

    it("reflects moz-extension:// origins", async () => {
        const assets = makeAssets({ status: 200, body: "ok" });
        const res = await app.request(
            "https://app.example.com/anything",
            { headers: { origin: "moz-extension://some-firefox-id" } },
            { ...baseEnv, ASSETS: assets },
        );
        expect(res.headers.get("access-control-allow-origin")).toBe(
            "moz-extension://some-firefox-id",
        );
    });

    it("blocks unknown external origins", async () => {
        const assets = makeAssets({ status: 200, body: "ok" });
        const res = await app.request(
            "https://app.example.com/anything",
            { headers: { origin: "https://evil.example.com" } },
            { ...baseEnv, ASSETS: assets },
        );
        expect(res.headers.get("access-control-allow-origin")).toBeNull();
    });
});

// ---------------------------------------------------------------------------
// /graphql route (line 47 of index.tsx)
// ---------------------------------------------------------------------------
describe("/graphql route", () => {
    it("handles POST requests to /graphql", async () => {
        const assets = makeAssets();
        const res = await app.request(
            "https://app.example.com/graphql",
            { method: "POST", body: '{"query":"{__typename}"}' },
            { ...baseEnv, ASSETS: assets },
        );
        expect(res.status).toBe(200);
    });
});

// ---------------------------------------------------------------------------
// Static asset catch-all route (lines 50-76 of index.tsx)
// ---------------------------------------------------------------------------
describe("Static asset catch-all route", () => {
    it("serves assets when they exist (200 response)", async () => {
        const assets = makeAssets({
            status: 200,
            body: "body { color: red; }",
        });
        const res = await app.request(
            "https://app.example.com/style.css",
            {},
            { ...baseEnv, ASSETS: assets },
        );
        expect(res.status).toBe(200);
        expect(await res.text()).toBe("body { color: red; }");
    });

    it("returns 404 for non-HTML asset-not-found requests (no fallback)", async () => {
        const assets = makeAssets({ status: 404 });
        const res = await app.request(
            "https://app.example.com/missing.json",
            { headers: { accept: "application/json" } },
            { ...baseEnv, ASSETS: assets },
        );
        expect(res.status).toBe(404);
        // ASSETS.fetch should only be called once (no fallback for non-HTML)
        expect(assets.fetch).toHaveBeenCalledTimes(1);
    });

    it("returns 404 when asset not found and no accept header (covers accept ?? '' branch)", async () => {
        const assets = makeAssets({ status: 404 });
        const res = await app.request(
            "https://app.example.com/missing.bin",
            {}, // no accept header → c.req.header("accept") returns null
            { ...baseEnv, ASSETS: assets },
        );
        expect(res.status).toBe(404);
        expect(assets.fetch).toHaveBeenCalledTimes(1);
    });

    it("falls back to /index.html for HTML requests when asset not found", async () => {
        const assets: AssetsFetcher = {
            fetch: vi
                .fn()
                .mockResolvedValueOnce(
                    new Response("Not Found", { status: 404 }),
                )
                .mockResolvedValueOnce(
                    new Response("<html><body>app</body></html>", {
                        status: 200,
                    }),
                ),
        };
        const res = await app.request(
            "https://app.example.com/some-spa-route",
            { headers: { accept: "text/html,application/xhtml+xml" } },
            { ...baseEnv, ASSETS: assets },
        );
        expect(res.status).toBe(200);
        expect(assets.fetch).toHaveBeenCalledTimes(2);
    });

    it("returns original 404 when index.html fallback is also missing", async () => {
        const assets: AssetsFetcher = {
            fetch: vi
                .fn()
                .mockResolvedValueOnce(
                    new Response("Not Found", { status: 404 }),
                )
                .mockResolvedValueOnce(
                    new Response("Not Found", { status: 404 }),
                ),
        };
        const res = await app.request(
            "https://app.example.com/deep/route",
            { headers: { accept: "text/html" } },
            { ...baseEnv, ASSETS: assets },
        );
        // Falls back through and returns the original 404 asset response
        expect(res.status).toBe(404);
        expect(assets.fetch).toHaveBeenCalledTimes(2);
    });
});
