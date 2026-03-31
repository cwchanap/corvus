import { describe, expect, it } from "vitest";
import { isValidUrl } from "./url";

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
});
