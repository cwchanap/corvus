import { createServerClient } from "@supabase/ssr";
import type { Context } from "hono";
import type { SupabaseClient } from "@supabase/supabase-js";

const LOCALHOST_HOSTNAMES = new Set(["localhost", "127.0.0.1", "::1"]);

function getRequiredEnvValue(c: Context, key: string): string {
    const value = c.env[key as keyof typeof c.env];
    if (typeof value !== "string" || value.trim().length === 0) {
        throw new Error(
            `createSupabaseServerClient: missing required environment variable ${key}`,
        );
    }

    return value;
}

function readBooleanEnv(value: unknown): boolean {
    if (typeof value === "boolean") return value;
    if (typeof value === "number") return value !== 0;
    if (typeof value !== "string") return false;

    const normalized = value.trim().toLowerCase();
    return (
        normalized === "1" ||
        normalized === "true" ||
        normalized === "yes" ||
        normalized === "on"
    );
}

function isLocalInsecureRequest(c: Context): boolean {
    const requestUrl = new URL(c.req.url);
    return (
        requestUrl.protocol === "http:" &&
        LOCALHOST_HOSTNAMES.has(requestUrl.hostname)
    );
}

function isExtensionOriginRequest(c: Context): boolean {
    const origin = c.req.header("origin");
    if (!origin) {
        return false;
    }

    return (
        origin.startsWith("chrome-extension://") ||
        origin.startsWith("moz-extension://")
    );
}

export function createSupabaseServerClient(c: Context): SupabaseClient {
    const supabaseUrl = getRequiredEnvValue(c, "SUPABASE_URL");
    const supabaseAnonKey = getRequiredEnvValue(c, "SUPABASE_ANON_KEY");
    const isDev =
        readBooleanEnv(c.env.DEV) ||
        readBooleanEnv(c.env.INSECURE_COOKIES) ||
        isLocalInsecureRequest(c);
    const requiresCrossSiteCookies = isExtensionOriginRequest(c);

    return createServerClient(supabaseUrl, supabaseAnonKey, {
        cookies: {
            getAll() {
                const cookieHeader = c.req.header("cookie") ?? "";
                return cookieHeader
                    .split(";")
                    .map((s) => s.trim())
                    .filter(Boolean)
                    .map((s) => {
                        const idx = s.indexOf("=");
                        if (idx === -1) return { name: s, value: "" };

                        const rawValue = s.slice(idx + 1);
                        let value = rawValue;
                        try {
                            value = decodeURIComponent(rawValue);
                        } catch (e) {
                            console.warn(
                                `[supabase-client] Failed to decode cookie "${s.slice(0, idx)}"; using raw value:`,
                                e,
                            );
                            value = rawValue;
                        }

                        return {
                            name: s.slice(0, idx),
                            value,
                        };
                    });
            },
            setAll(cookiesToSet) {
                for (const { name, value, options } of cookiesToSet) {
                    const encodedValue = encodeURIComponent(value);
                    const parts = [
                        `${name}=${encodedValue}`,
                        "HttpOnly",
                        options?.path ? `Path=${options.path}` : "Path=/",
                        options?.domain ? `Domain=${options.domain}` : "",
                        isDev && !requiresCrossSiteCookies
                            ? "SameSite=Lax"
                            : "SameSite=None",
                        isDev && !requiresCrossSiteCookies ? "" : "Secure",
                        options?.maxAge != null
                            ? `Max-Age=${options.maxAge}`
                            : "",
                        options?.expires
                            ? `Expires=${options.expires.toUTCString()}`
                            : "",
                    ].filter(Boolean);
                    c.header("Set-Cookie", parts.join("; "), { append: true });
                }
            },
        },
    });
}
