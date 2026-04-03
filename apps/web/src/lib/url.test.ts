import { describe, expect, it } from "vitest";
import { isValidUrl, normalizeHttpUrl } from "./url";

describe("isValidUrl", () => {
    it("accepts well-formed absolute URLs", () => {
        expect(isValidUrl("https://example.com/item")).toBe(true);
    });

    it("accepts URLs with surrounding whitespace", () => {
        expect(isValidUrl("  https://example.com/item  ")).toBe(true);
    });

    it("rejects malformed URLs", () => {
        expect(isValidUrl("not a url")).toBe(false);
    });

    it("rejects empty strings", () => {
        expect(isValidUrl("")).toBe(false);
    });

    it("accepts http:// protocol", () => {
        expect(isValidUrl("http://example.com/item")).toBe(true);
    });

    it("rejects ftp:// protocol", () => {
        expect(isValidUrl("ftp://example.com/file")).toBe(false);
    });

    it("rejects data: protocol", () => {
        expect(isValidUrl("data:text/html,<h1>Hi</h1>")).toBe(false);
    });

    it("rejects javascript: protocol", () => {
        expect(isValidUrl("javascript:void(0)")).toBe(false);
    });
});

describe("normalizeHttpUrl", () => {
    it("canonicalizes supported urls for duplicate comparisons", () => {
        expect(
            normalizeHttpUrl("  HTTPS://Example.com:443/path/?b=2&a=1  "),
        ).toBe("https://example.com/path?a=1&b=2");
    });
});
