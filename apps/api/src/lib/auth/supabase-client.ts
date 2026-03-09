import { createServerClient } from "@supabase/ssr";
import type { Context } from "hono";
import type { SupabaseClient } from "@supabase/supabase-js";

export function createSupabaseServerClient(c: Context): SupabaseClient {
    const supabaseUrl = c.env.SUPABASE_URL as string;
    const supabaseAnonKey = c.env.SUPABASE_ANON_KEY as string;
    const isDev = Boolean(c.env.DEV) || Boolean(c.env.INSECURE_COOKIES);

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
                        return {
                            name: s.slice(0, idx),
                            value: s.slice(idx + 1),
                        };
                    });
            },
            setAll(cookiesToSet) {
                for (const { name, value, options } of cookiesToSet) {
                    const parts = [
                        `${name}=${value}`,
                        "HttpOnly",
                        options?.path ? `Path=${options.path}` : "Path=/",
                        isDev ? "SameSite=Lax" : "SameSite=None",
                        isDev ? "" : "Secure",
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
