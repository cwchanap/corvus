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

    it("returns null when cookie header is null", () => {
        expect(readCookie(null, "corvus-session")).toBeNull();
    });

    it("returns null when cookie header is undefined", () => {
        expect(readCookie(undefined, "corvus-session")).toBeNull();
    });

    it("returns empty string for cookie with no value", () => {
        expect(readCookie("corvus-session", "corvus-session")).toBe("");
    });

    it("returns raw value when decodeURIComponent fails", () => {
        expect(readCookie("session=%E0%A4%A", "session")).toBe("%E0%A4%A");
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

    it("builds explicit cross-site secure cookies without an extension origin", () => {
        const header = buildSetCookie({
            name: "corvus-session",
            value: "session-123",
            maxAge: 3600,
            requestUrl: "https://app.example.com/auth/google/callback",
            sameSite: "None",
            env: {},
        });

        expect(header).toContain("SameSite=None");
        expect(header).toContain("Secure");
    });

    it("builds cross-site secure cookies for moz-extension origins", () => {
        const header = buildSetCookie({
            name: "corvus-session",
            value: "session-123",
            maxAge: 3600,
            requestUrl: "http://localhost:5002/graphql",
            origin: "moz-extension://some-id",
            env: {},
        });

        expect(header).toContain("SameSite=None");
        expect(header).toContain("Secure");
    });

    it("builds secure cookies for https request urls", () => {
        const header = buildSetCookie({
            name: "corvus-session",
            value: "session-123",
            maxAge: 3600,
            requestUrl: "https://app.example.com/graphql",
            env: {},
        });

        expect(header).toContain("Secure");
        expect(header).toContain("SameSite=Lax");
    });

    it("includes Expires when expires option is provided", () => {
        const expires = new Date("2026-06-01T00:00:00.000Z");
        const header = buildSetCookie({
            name: "corvus-session",
            value: "session-123",
            maxAge: 3600,
            expires,
            requestUrl: "https://app.example.com/graphql",
            env: {},
        });

        expect(header).toContain(`Expires=${expires.toUTCString()}`);
    });

    it("builds non-secure cookies when DEV env is 1", () => {
        const header = buildSetCookie({
            name: "corvus-session",
            value: "session-123",
            maxAge: 3600,
            requestUrl: "https://app.example.com/graphql",
            env: { DEV: "1" },
        });

        expect(header).not.toContain("Secure");
    });

    it("builds non-secure cookies when INSECURE_COOKIES env is true", () => {
        const header = buildSetCookie({
            name: "corvus-session",
            value: "session-123",
            maxAge: 3600,
            requestUrl: "https://app.example.com/graphql",
            env: { INSECURE_COOKIES: "true" },
        });

        expect(header).not.toContain("Secure");
    });

    it("builds non-secure cookies when DEV env is boolean true", () => {
        const header = buildSetCookie({
            name: "corvus-session",
            value: "session-123",
            maxAge: 3600,
            requestUrl: "https://app.example.com/graphql",
            env: { DEV: true },
        });

        expect(header).not.toContain("Secure");
    });

    it("builds non-secure cookies when DEV env is number 1", () => {
        const header = buildSetCookie({
            name: "corvus-session",
            value: "session-123",
            maxAge: 3600,
            requestUrl: "https://app.example.com/graphql",
            env: { DEV: 1 },
        });

        expect(header).not.toContain("Secure");
    });

    it("builds secure cookies when DEV env is 0", () => {
        const header = buildSetCookie({
            name: "corvus-session",
            value: "session-123",
            maxAge: 3600,
            requestUrl: "https://app.example.com/graphql",
            env: { DEV: 0 },
        });

        expect(header).toContain("Secure");
    });

    it("builds non-secure cookies for DEV=yes and DEV=on", () => {
        const headerYes = buildSetCookie({
            name: "corvus-session",
            value: "s",
            maxAge: 60,
            requestUrl: "https://example.com",
            env: { DEV: "yes" },
        });
        const headerOn = buildSetCookie({
            name: "corvus-session",
            value: "s",
            maxAge: 60,
            requestUrl: "https://example.com",
            env: { DEV: "on" },
        });

        expect(headerYes).not.toContain("Secure");
        expect(headerOn).not.toContain("Secure");
    });

    it("builds secure cookies for non-truthy DEV string values", () => {
        const header = buildSetCookie({
            name: "corvus-session",
            value: "s",
            maxAge: 60,
            requestUrl: "https://example.com",
            env: { DEV: "false" },
        });

        expect(header).toContain("Secure");
    });

    it("builds secure cookies when DEV env is null", () => {
        const header = buildSetCookie({
            name: "corvus-session",
            value: "s",
            maxAge: 60,
            requestUrl: "https://example.com",
            env: { DEV: null },
        });

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
