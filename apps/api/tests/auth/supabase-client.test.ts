import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Context } from "hono";

// We mock @supabase/ssr to capture the cookies callbacks without needing a real Supabase project
vi.mock("@supabase/ssr", () => ({
    createServerClient: vi.fn(() => ({ _mocked: true })),
}));

import { createSupabaseServerClient } from "../../src/lib/auth/supabase-client";
import { createServerClient } from "@supabase/ssr";

const mockCreateServerClient = createServerClient as ReturnType<typeof vi.fn>;

type SetCookieHeaderCall = {
    value: string;
    options?: unknown;
};

// Helper to build a minimal Hono Context mock
function makeContext(overrides: {
    env?: Record<string, unknown>;
    cookieHeader?: string;
    originHeader?: string;
    requestUrl?: string;
}): Context {
    const setCookieHeaders: SetCookieHeaderCall[] = [];
    return {
        env: {
            SUPABASE_URL: "https://example.supabase.co",
            SUPABASE_ANON_KEY: "anon-key-value",
            ...overrides.env,
        },
        req: {
            url: overrides.requestUrl ?? "https://app.example.com/graphql",
            header: (name: string) => {
                if (name === "cookie") return overrides.cookieHeader ?? "";
                if (name === "origin") return overrides.originHeader;
                return undefined;
            },
        },
        header: (_name: string, value: string, options?: unknown) => {
            setCookieHeaders.push({ value, options });
        },
        _setCookieHeaders: setCookieHeaders,
    } as unknown as Context;
}

// Extracts the cookies callbacks from the last createServerClient call
function getCookiesCallbacks() {
    const lastCall = mockCreateServerClient.mock.calls.at(-1);
    return lastCall?.[2]?.cookies as {
        getAll: () => { name: string; value: string }[];
        setAll: (
            cookies: {
                name: string;
                value: string;
                options?: Record<string, unknown>;
            }[],
        ) => void;
    };
}

describe("createSupabaseServerClient", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("getRequiredEnvValue (via createSupabaseServerClient)", () => {
        it("throws when SUPABASE_URL is missing", () => {
            const ctx = makeContext({
                env: { SUPABASE_URL: undefined, SUPABASE_ANON_KEY: "key" },
            });
            expect(() => createSupabaseServerClient(ctx)).toThrow(
                "missing required environment variable SUPABASE_URL",
            );
        });

        it("throws when SUPABASE_URL is an empty string", () => {
            const ctx = makeContext({
                env: { SUPABASE_URL: "  ", SUPABASE_ANON_KEY: "key" },
            });
            expect(() => createSupabaseServerClient(ctx)).toThrow(
                "missing required environment variable SUPABASE_URL",
            );
        });

        it("throws when SUPABASE_ANON_KEY is missing", () => {
            const ctx = makeContext({
                env: {
                    SUPABASE_URL: "https://x.supabase.co",
                    SUPABASE_ANON_KEY: undefined,
                },
            });
            expect(() => createSupabaseServerClient(ctx)).toThrow(
                "missing required environment variable SUPABASE_ANON_KEY",
            );
        });

        it("succeeds when both env vars are present", () => {
            const ctx = makeContext({});
            expect(() => createSupabaseServerClient(ctx)).not.toThrow();
        });
    });

    describe("cookies.getAll", () => {
        it("returns empty array when cookie header is absent", () => {
            const ctx = makeContext({ cookieHeader: "" });
            createSupabaseServerClient(ctx);
            const { getAll } = getCookiesCallbacks();
            expect(getAll()).toEqual([]);
        });

        it("parses a single cookie", () => {
            const ctx = makeContext({ cookieHeader: "session=abc123" });
            createSupabaseServerClient(ctx);
            const { getAll } = getCookiesCallbacks();
            expect(getAll()).toEqual([{ name: "session", value: "abc123" }]);
        });

        it("parses multiple semicolon-separated cookies", () => {
            const ctx = makeContext({ cookieHeader: "a=1; b=2; c=3" });
            createSupabaseServerClient(ctx);
            const { getAll } = getCookiesCallbacks();
            expect(getAll()).toEqual([
                { name: "a", value: "1" },
                { name: "b", value: "2" },
                { name: "c", value: "3" },
            ]);
        });

        it("URL-decodes encoded cookie values", () => {
            const encoded = encodeURIComponent("hello world+test=value");
            const ctx = makeContext({ cookieHeader: `tok=${encoded}` });
            createSupabaseServerClient(ctx);
            const { getAll } = getCookiesCallbacks();
            expect(getAll()).toEqual([
                { name: "tok", value: "hello world+test=value" },
            ]);
        });

        it("falls back to raw value when decodeURIComponent fails", () => {
            // A bare % triggers a URIError
            const ctx = makeContext({ cookieHeader: "broken=%" });
            createSupabaseServerClient(ctx);
            const { getAll } = getCookiesCallbacks();
            expect(getAll()).toEqual([{ name: "broken", value: "%" }]);
        });

        it("returns empty value for cookie with no = sign", () => {
            const ctx = makeContext({ cookieHeader: "flagcookie" });
            createSupabaseServerClient(ctx);
            const { getAll } = getCookiesCallbacks();
            expect(getAll()).toEqual([{ name: "flagcookie", value: "" }]);
        });
    });

    describe("cookies.setAll", () => {
        it("writes HttpOnly and Path=/ on every cookie", () => {
            const ctx = makeContext({ env: { DEV: "false" } });
            createSupabaseServerClient(ctx);
            const { setAll } = getCookiesCallbacks();
            setAll([{ name: "sb-token", value: "mytoken", options: {} }]);

            const raw = (
                ctx as unknown as { _setCookieHeaders: SetCookieHeaderCall[] }
            )._setCookieHeaders[0];
            expect(raw?.value).toContain("HttpOnly");
            expect(raw?.value).toContain("Path=/");
        });

        it("sets SameSite=None; Secure in production (DEV=false)", () => {
            const ctx = makeContext({
                env: { DEV: "false", INSECURE_COOKIES: "false" },
            });
            createSupabaseServerClient(ctx);
            const { setAll } = getCookiesCallbacks();
            setAll([{ name: "tok", value: "val", options: {} }]);

            const raw = (
                ctx as unknown as { _setCookieHeaders: SetCookieHeaderCall[] }
            )._setCookieHeaders[0];
            expect(raw?.value).toContain("SameSite=None");
            expect(raw?.value).toContain("Secure");
        });

        it("sets SameSite=Lax without Secure in dev (DEV=true)", () => {
            const ctx = makeContext({ env: { DEV: "true" } });
            createSupabaseServerClient(ctx);
            const { setAll } = getCookiesCallbacks();
            setAll([{ name: "tok", value: "val", options: {} }]);

            const raw = (
                ctx as unknown as { _setCookieHeaders: SetCookieHeaderCall[] }
            )._setCookieHeaders[0];
            expect(raw?.value).toContain("SameSite=Lax");
            expect(raw?.value).not.toContain("Secure");
        });

        it("sets SameSite=Lax without Secure for local http requests when DEV is not bound", () => {
            const ctx = makeContext({
                env: { INSECURE_COOKIES: "false" },
                requestUrl: "http://localhost:5002/graphql",
            });
            createSupabaseServerClient(ctx);
            const { setAll } = getCookiesCallbacks();
            setAll([{ name: "tok", value: "val", options: {} }]);

            const raw = (
                ctx as unknown as { _setCookieHeaders: SetCookieHeaderCall[] }
            )._setCookieHeaders[0];
            expect(raw?.value).toContain("SameSite=Lax");
            expect(raw?.value).not.toContain("Secure");
        });

        it("sets SameSite=None without Secure for local extension requests", () => {
            const ctx = makeContext({
                env: { INSECURE_COOKIES: "false" },
                originHeader: "chrome-extension://abcdefghijklmnop",
                requestUrl: "http://localhost:8787/graphql",
            });
            createSupabaseServerClient(ctx);
            const { setAll } = getCookiesCallbacks();
            setAll([{ name: "tok", value: "val", options: {} }]);

            const raw = (
                ctx as unknown as { _setCookieHeaders: SetCookieHeaderCall[] }
            )._setCookieHeaders[0];
            expect(raw?.value).toContain("SameSite=None");
            expect(raw?.value).not.toContain("Secure");
        });

        it("URL-encodes cookie values", () => {
            const ctx = makeContext({ env: { DEV: "true" } });
            createSupabaseServerClient(ctx);
            const { setAll } = getCookiesCallbacks();
            setAll([{ name: "tok", value: "hello world", options: {} }]);

            const raw = (
                ctx as unknown as { _setCookieHeaders: SetCookieHeaderCall[] }
            )._setCookieHeaders[0];
            expect(raw?.value).toContain("tok=hello%20world");
        });

        it("includes Max-Age when provided in options", () => {
            const ctx = makeContext({ env: { DEV: "true" } });
            createSupabaseServerClient(ctx);
            const { setAll } = getCookiesCallbacks();
            setAll([{ name: "tok", value: "val", options: { maxAge: 3600 } }]);

            const raw = (
                ctx as unknown as { _setCookieHeaders: SetCookieHeaderCall[] }
            )._setCookieHeaders[0];
            expect(raw?.value).toContain("Max-Age=3600");
        });

        it("includes Domain when provided in options", () => {
            const ctx = makeContext({ env: { DEV: "true" } });
            createSupabaseServerClient(ctx);
            const { setAll } = getCookiesCallbacks();
            setAll([
                {
                    name: "tok",
                    value: "val",
                    options: { domain: ".example.com" },
                },
            ]);

            const raw = (
                ctx as unknown as { _setCookieHeaders: SetCookieHeaderCall[] }
            )._setCookieHeaders[0];
            expect(raw?.value).toContain("Domain=.example.com");
        });

        it("omits Domain when not provided", () => {
            const ctx = makeContext({ env: { DEV: "true" } });
            createSupabaseServerClient(ctx);
            const { setAll } = getCookiesCallbacks();
            setAll([{ name: "tok", value: "val", options: {} }]);

            const raw = (
                ctx as unknown as { _setCookieHeaders: SetCookieHeaderCall[] }
            )._setCookieHeaders[0];
            expect(raw?.value).not.toContain("Domain");
        });

        it("omits Max-Age when not provided", () => {
            const ctx = makeContext({ env: { DEV: "true" } });
            createSupabaseServerClient(ctx);
            const { setAll } = getCookiesCallbacks();
            setAll([{ name: "tok", value: "val", options: {} }]);

            const raw = (
                ctx as unknown as { _setCookieHeaders: SetCookieHeaderCall[] }
            )._setCookieHeaders[0];
            expect(raw?.value).not.toContain("Max-Age");
        });

        it("preserves append semantics when Supabase sets multiple cookies", () => {
            const ctx = makeContext({ env: { DEV: "true" } });
            createSupabaseServerClient(ctx);
            const { setAll } = getCookiesCallbacks();
            setAll([
                { name: "sb-access-token", value: "token-a", options: {} },
                { name: "sb-refresh-token", value: "token-b", options: {} },
            ]);

            const headers = (
                ctx as unknown as { _setCookieHeaders: SetCookieHeaderCall[] }
            )._setCookieHeaders;

            expect(headers).toHaveLength(2);
            expect(headers).toEqual([
                expect.objectContaining({
                    value: expect.stringContaining("sb-access-token=token-a"),
                    options: { append: true },
                }),
                expect.objectContaining({
                    value: expect.stringContaining("sb-refresh-token=token-b"),
                    options: { append: true },
                }),
            ]);
        });
    });

    describe("readBooleanEnv (via DEV/INSECURE_COOKIES flags)", () => {
        const truthyValues = ["1", "true", "yes", "on", "TRUE", "YES"];
        const falsyValues = ["0", "false", "no", "off", "", "random"];

        for (const val of truthyValues) {
            it(`treats DEV="${val}" as isDev=true (SameSite=Lax)`, () => {
                const ctx = makeContext({ env: { DEV: val } });
                createSupabaseServerClient(ctx);
                const { setAll } = getCookiesCallbacks();
                setAll([{ name: "t", value: "v", options: {} }]);
                const raw = (
                    ctx as unknown as {
                        _setCookieHeaders: SetCookieHeaderCall[];
                    }
                )._setCookieHeaders[0];
                expect(raw?.value).toContain("SameSite=Lax");
            });
        }

        for (const val of falsyValues) {
            it(`treats DEV="${val}" as isDev=false (SameSite=None)`, () => {
                const ctx = makeContext({ env: { DEV: val } });
                createSupabaseServerClient(ctx);
                const { setAll } = getCookiesCallbacks();
                setAll([{ name: "t", value: "v", options: {} }]);
                const raw = (
                    ctx as unknown as {
                        _setCookieHeaders: SetCookieHeaderCall[];
                    }
                )._setCookieHeaders[0];
                expect(raw?.value).toContain("SameSite=None");
            });
        }
    });
});
