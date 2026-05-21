export const SESSION_COOKIE_NAME = "corvus-session";
export const OAUTH_STATE_COOKIE_NAME = "corvus-oauth-state";
export const OAUTH_SOURCE_COOKIE_NAME = "corvus-oauth-source";

interface CookieOptions {
    name: string;
    requestUrl: string;
    env: Record<string, unknown>;
    origin?: string;
    sameSite?: "Lax" | "None";
}

interface SetCookieOptions extends CookieOptions {
    value: string;
    maxAge: number;
    expires?: Date;
}

export function readCookie(
    cookieHeader: string | null | undefined,
    name: string,
): string | null {
    const cookies = (cookieHeader ?? "")
        .split(";")
        .map((part) => part.trim())
        .filter(Boolean);

    for (const cookie of cookies) {
        const index = cookie.indexOf("=");
        const cookieName = index === -1 ? cookie : cookie.slice(0, index);
        if (cookieName !== name) {
            continue;
        }

        const rawValue = index === -1 ? "" : cookie.slice(index + 1);
        try {
            return decodeURIComponent(rawValue);
        } catch {
            return rawValue;
        }
    }

    return null;
}

export function buildSetCookie(options: SetCookieOptions): string {
    const attributes = getCookieSecurityAttributes(options);
    const parts = [
        `${options.name}=${encodeURIComponent(options.value)}`,
        "HttpOnly",
        "Path=/",
        `SameSite=${attributes.sameSite}`,
        attributes.secure ? "Secure" : "",
        `Max-Age=${options.maxAge}`,
        options.expires ? `Expires=${options.expires.toUTCString()}` : "",
    ];

    return parts.filter(Boolean).join("; ");
}

export function buildExpiredCookie(options: CookieOptions): string {
    return buildSetCookie({
        ...options,
        value: "",
        maxAge: 0,
        expires: new Date(0),
    });
}

function getCookieSecurityAttributes(options: CookieOptions): {
    sameSite: "Lax" | "None";
    secure: boolean;
} {
    if (options.sameSite === "None") {
        return { sameSite: "None", secure: true };
    }

    if (options.sameSite === "Lax") {
        return { sameSite: "Lax", secure: shouldUseSecureCookie(options) };
    }

    const extensionOrigin =
        options.origin?.startsWith("chrome-extension://") ||
        options.origin?.startsWith("moz-extension://");

    if (extensionOrigin) {
        return { sameSite: "None", secure: true };
    }

    return {
        sameSite: "Lax",
        secure: shouldUseSecureCookie(options),
    };
}

function shouldUseSecureCookie(options: CookieOptions): boolean {
    const requestUrl = new URL(options.requestUrl);
    const localInsecure =
        requestUrl.protocol === "http:" ||
        readBooleanEnv(options.env.DEV) ||
        readBooleanEnv(options.env.INSECURE_COOKIES);

    return !localInsecure;
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
