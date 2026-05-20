import { describe, expect, it } from "vitest";
import {
    buildExpiredCookie,
    buildSetCookie,
    readCookie,
} from "../../src/lib/auth/cookies";

describe("auth cookie helpers", () => {
    it("reads URL-decoded cookie values", () => {
        const cookie = `theme=dark; corvus-session=${encodeURIComponent(
            "session value",
        )}; flag`;

        expect(readCookie(cookie, "corvus-session")).toBe("session value");
        expect(readCookie(cookie, "missing")).toBeNull();
    });

    it("builds lax non-secure cookies for local http requests", () => {
        const header = buildSetCookie({
            name: "corvus-session",
            value: "session-123",
            maxAge: 3600,
            requestUrl: "http://localhost:5002/graphql",
            env: {},
        });

        expect(header).toContain("corvus-session=session-123");
        expect(header).toContain("HttpOnly");
        expect(header).toContain("Path=/");
        expect(header).toContain("SameSite=Lax");
        expect(header).toContain("Max-Age=3600");
        expect(header).not.toContain("Secure");
    });

    it("builds cross-site secure cookies for extension requests", () => {
        const header = buildSetCookie({
            name: "corvus-session",
            value: "session-123",
            maxAge: 3600,
            requestUrl: "http://localhost:5002/graphql",
            origin: "chrome-extension://abcdefghijklmnop",
            env: {},
        });

        expect(header).toContain("SameSite=None");
        expect(header).toContain("Secure");
    });

    it("builds expired cookies for logout", () => {
        const header = buildExpiredCookie({
            name: "corvus-session",
            requestUrl: "https://app.example.com/graphql",
            env: {},
        });

        expect(header).toContain("corvus-session=");
        expect(header).toContain("Max-Age=0");
        expect(header).toContain("Expires=Thu, 01 Jan 1970 00:00:00 GMT");
        expect(header).toContain("Secure");
    });
});
