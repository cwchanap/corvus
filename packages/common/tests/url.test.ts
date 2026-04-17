import { describe, expect, it } from "vitest";
import { normalizeHttpUrl } from "../src/url";

describe("normalizeHttpUrl", () => {
    it("normalizes origin-only urls without a trailing slash", () => {
        expect(normalizeHttpUrl("HTTPS://Example.COM:443")).toBe(
            "https://example.com",
        );
    });

    it("trims and normalizes hostname, trailing slash, and default port", () => {
        expect(
            normalizeHttpUrl("  HTTPS://Example.COM:443/path/to/item/  "),
        ).toBe("https://example.com/path/to/item");
    });

    it("sorts query parameters consistently", () => {
        expect(normalizeHttpUrl("https://example.com/item?b=2&a=1&b=1")).toBe(
            "https://example.com/item?a=1&b=1&b=2",
        );
    });

    it("strips www. prefix from hostname", () => {
        expect(normalizeHttpUrl("https://www.example.com/item")).toBe(
            "https://example.com/item",
        );
        expect(normalizeHttpUrl("https://WWW.Example.COM/item")).toBe(
            "https://example.com/item",
        );
    });

    it("leaves unsupported or invalid urls trimmed but otherwise unchanged", () => {
        expect(normalizeHttpUrl("  ftp://example.com/file  ")).toBe(
            "ftp://example.com/file",
        );
        expect(normalizeHttpUrl("  not a url  ")).toBe("not a url");
    });

    it("preserves the path separator before query params on root URLs", () => {
        expect(normalizeHttpUrl("https://example.com/?foo=bar")).toBe(
            "https://example.com/?foo=bar",
        );
        expect(normalizeHttpUrl("https://example.com?foo=bar")).toBe(
            "https://example.com/?foo=bar",
        );
    });

    it("preserves the path separator before hash on root URLs", () => {
        expect(normalizeHttpUrl("https://example.com/#section")).toBe(
            "https://example.com/#section",
        );
    });

    it("normalizes double trailing slash to origin only", () => {
        expect(normalizeHttpUrl("https://example.com//")).toBe(
            "https://example.com",
        );
    });

    it("preserves username and password credentials in URLs", () => {
        expect(normalizeHttpUrl("https://user:pass@example.com/item")).toBe(
            "https://user:pass@example.com/item",
        );
    });

    it("preserves username-only credential in URLs", () => {
        expect(normalizeHttpUrl("https://user@example.com/item")).toBe(
            "https://user@example.com/item",
        );
    });

    it("returns empty string for empty input", () => {
        expect(normalizeHttpUrl("")).toBe("");
        expect(normalizeHttpUrl("   ")).toBe("");
    });
});
