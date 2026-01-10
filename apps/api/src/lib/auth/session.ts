import type { Context } from "hono";
import type { PublicUser } from "../db/types";

export interface SessionData {
    userId: number;
    sessionId: string;
}

const SESSION_COOKIE_NAME = "corvus-session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export function getSessionCookie(c?: Context): string | undefined {
    const cookieHeader = c?.req.header("cookie");
    if (!cookieHeader) return undefined;

    const cookies = cookieHeader.split(";").map((c) => c.trim());
    for (const cookie of cookies) {
        if (cookie.startsWith(`${SESSION_COOKIE_NAME}=`)) {
            return cookie.substring(SESSION_COOKIE_NAME.length + 1);
        }
    }
    return undefined;
}

export function setSessionCookie(c: Context, sessionId: string): void {
    const isDev = Boolean(c.env.DEV) || Boolean(c.env.INSECURE_COOKIES);

    // URL-encode the sessionId to safely escape special characters
    const encodedSessionId = encodeURIComponent(sessionId);

    const cookieOptions = [
        `HttpOnly`,
        isDev ? `SameSite=Lax` : `SameSite=None`,
        isDev ? "" : `Secure`,
        `Max-Age=${SESSION_MAX_AGE}`,
        `Path=/`,
    ]
        .filter(Boolean)
        .join("; ");

    c.header(
        "Set-Cookie",
        `${SESSION_COOKIE_NAME}=${encodedSessionId}; ${cookieOptions}`,
    );
}

export function clearSessionCookie(c: Context): void {
    const isDev = Boolean(c.env.DEV) || Boolean(c.env.INSECURE_COOKIES);
    const cookieOptions = [
        `HttpOnly`,
        isDev ? `SameSite=Lax` : `SameSite=None`,
        isDev ? "" : `Secure`,
        `Max-Age=0`,
        `Expires=0`,
        `Path=/`,
    ]
        .filter(Boolean)
        .join("; ");

    // Must match the same attributes (at least path) used when setting the cookie
    c.header("Set-Cookie", `${SESSION_COOKIE_NAME}=; ${cookieOptions}`);
}

export function requireAuth(user: PublicUser | null): PublicUser {
    if (!user) {
        throw new Error("Authentication required");
    }
    return user;
}
