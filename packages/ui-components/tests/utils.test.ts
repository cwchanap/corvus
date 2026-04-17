import { describe, it, expect } from "vitest";
import { cn } from "../src/utils";

describe("cn", () => {
    it("returns a single class unchanged", () => {
        expect(cn("foo")).toBe("foo");
    });

    it("joins multiple classes", () => {
        expect(cn("foo", "bar")).toBe("foo bar");
    });

    it("filters falsy values", () => {
        expect(cn("foo", false, null, undefined, "bar")).toBe("foo bar");
    });

    it("merges conflicting Tailwind classes (last wins)", () => {
        expect(cn("p-4", "p-2")).toBe("p-2");
    });

    it("handles conditional object syntax from clsx", () => {
        expect(cn({ "text-red-500": true, "text-blue-500": false })).toBe(
            "text-red-500",
        );
    });

    it("handles array syntax from clsx", () => {
        expect(cn(["foo", "bar"])).toBe("foo bar");
    });

    it("returns empty string when no args", () => {
        expect(cn()).toBe("");
    });
});
