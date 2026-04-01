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

    it("leaves unsupported or invalid urls trimmed but otherwise unchanged", () => {
        expect(normalizeHttpUrl("  ftp://example.com/file  ")).toBe(
            "ftp://example.com/file",
        );
        expect(normalizeHttpUrl("  not a url  ")).toBe("not a url");
    });
});
