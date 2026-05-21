import { beforeEach, describe, it, expect, vi } from "vitest";

const authMocks = vi.hoisted(() => ({
    getAuthorizationUrl: vi.fn((state: string) => {
        const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
        url.searchParams.set("state", state);
        return url.toString();
    }),
    handleCallback: vi.fn(),
}));

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

vi.mock("../src/lib/auth/service", () => ({
    GoogleAuthService: vi.fn(() => ({
        getAuthorizationUrl: authMocks.getAuthorizationUrl,
        handleCallback: authMocks.handleCallback,
    })),
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

beforeEach(() => {
    vi.clearAllMocks();
    authMocks.getAuthorizationUrl.mockImplementation((state: string) => {
        const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
        url.searchParams.set("state", state);
        return url.toString();
    });
    authMocks.handleCallback.mockResolvedValue({
        user: {
            id: "user-1",
            email: "test@example.com",
            name: "Test User",
            created_at: "2026-05-20T12:00:00.000Z",
            updated_at: "2026-05-20T12:00:00.000Z",
        },
        sessionId: "session-123",
        expiresAt: new Date("2026-06-19T12:00:00.000Z"),
    });
});

// ---------------------------------------------------------------------------
// Google OAuth routes
// ---------------------------------------------------------------------------
describe("Google OAuth routes", () => {
    it("redirects /auth/google/start to Google and sets a state cookie", async () => {
        const assets = makeAssets();
        const res = await app.request(
            "https://app.example.com/auth/google/start",
            {},
            { ...baseEnv, ASSETS: assets },
        );

        expect(res.status).toBe(302);
        expect(res.headers.get("location")).toContain(
            "https://accounts.google.com/o/oauth2/v2/auth",
        );
        expect(res.headers.get("set-cookie")).toContain("corvus-oauth-state=");
        expect(authMocks.getAuthorizationUrl).toHaveBeenCalledWith(
            expect.any(String),
        );
    });

    it("rejects /auth/google/callback when state does not match", async () => {
        const assets = makeAssets();
        const res = await app.request(
            "https://app.example.com/auth/google/callback?code=code-1&state=returned-state",
            {
                headers: {
                    cookie: "corvus-oauth-state=different-state",
                },
            },
            { ...baseEnv, ASSETS: assets },
        );

        expect(res.status).toBe(400);
        expect(await res.text()).toBe("Invalid OAuth state");
        expect(authMocks.handleCallback).not.toHaveBeenCalled();
    });

    it("sets a session cookie and redirects to dashboard after callback", async () => {
        const assets = makeAssets();
        const res = await app.request(
            "https://app.example.com/auth/google/callback?code=code-1&state=state-1",
            {
                headers: {
                    cookie: "corvus-oauth-state=state-1",
                },
            },
            { ...baseEnv, ASSETS: assets },
        );

        expect(res.status).toBe(302);
        expect(res.headers.get("location")).toBe("/dashboard");
        const setCookie = res.headers.get("set-cookie") ?? "";
        expect(setCookie).toContain("corvus-session=session-123");
        expect(setCookie).toContain("corvus-oauth-state=");
        expect(authMocks.handleCallback).toHaveBeenCalledWith("code-1");
    });

    it("redirects to login with error and clears state cookie when callback fails", async () => {
        authMocks.handleCallback.mockRejectedValue(
            new Error("Token exchange failed"),
        );
        const assets = makeAssets();
        const res = await app.request(
            "https://app.example.com/auth/google/callback?code=bad-code&state=state-1",
            {
                headers: {
                    cookie: "corvus-oauth-state=state-1",
                },
            },
            { ...baseEnv, ASSETS: assets },
        );

        expect(res.status).toBe(302);
        expect(res.headers.get("location")).toBe("/login?error=auth_failed");
        const setCookie = res.headers.get("set-cookie") ?? "";
        expect(setCookie).toContain("corvus-oauth-state=");
        expect(setCookie).toContain("Max-Age=0");
    });
});

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

// ---------------------------------------------------------------------------
// /__test__/auth/session guard
// ---------------------------------------------------------------------------
describe("/__test__/auth/session guard", () => {
    it("returns 404 when TEST_AUTH_ENABLED is not set", async () => {
        const assets = makeAssets();
        const res = await app.request(
            "https://app.example.com/__test__/auth/session",
            { method: "POST", body: JSON.stringify({}) },
            { ...baseEnv, ASSETS: assets, DEV: "1" },
        );

        expect(res.status).toBe(404);
    });

    it("returns 404 when TEST_AUTH_ENABLED is set but not in dev mode", async () => {
        const assets = makeAssets();
        const res = await app.request(
            "https://app.example.com/__test__/auth/session",
            { method: "POST", body: JSON.stringify({}) },
            { ...baseEnv, ASSETS: assets, TEST_AUTH_ENABLED: "1" },
        );

        expect(res.status).toBe(404);
    });

    it("returns 404 when DEV is set but TEST_AUTH_ENABLED is not", async () => {
        const assets = makeAssets();
        const res = await app.request(
            "https://app.example.com/__test__/auth/session",
            { method: "POST", body: JSON.stringify({}) },
            { ...baseEnv, ASSETS: assets, DEV: "1" },
        );

        expect(res.status).toBe(404);
    });
});
