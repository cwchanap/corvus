import { describe, it, expect, beforeEach } from "vitest";
import { applyThemeVariables } from "../../../src/lib/theme/init-styles";

// The module applies light theme on import as a side effect.
// We reset the document style before each test to ensure isolation.
beforeEach(() => {
    document.documentElement.removeAttribute("style");
});

describe("applyThemeVariables", () => {
    describe("light theme", () => {
        it("sets background to light value", () => {
            applyThemeVariables("light");
            expect(
                document.documentElement.style.getPropertyValue("--background"),
            ).toBe("40 33% 94%");
        });

        it("sets foreground to light value", () => {
            applyThemeVariables("light");
            expect(
                document.documentElement.style.getPropertyValue("--foreground"),
            ).toBe("30 10% 12%");
        });

        it("sets primary to light value", () => {
            applyThemeVariables("light");
            expect(
                document.documentElement.style.getPropertyValue("--primary"),
            ).toBe("14 60% 32%");
        });

        it("sets destructive to light value", () => {
            applyThemeVariables("light");
            expect(
                document.documentElement.style.getPropertyValue(
                    "--destructive",
                ),
            ).toBe("4 56% 38%");
        });

        it("sets border to light value", () => {
            applyThemeVariables("light");
            expect(
                document.documentElement.style.getPropertyValue("--border"),
            ).toBe("36 18% 82%");
        });

        it("sets radius", () => {
            applyThemeVariables("light");
            expect(
                document.documentElement.style.getPropertyValue("--radius"),
            ).toBe("0.125rem");
        });
    });

    describe("dark theme", () => {
        it("sets background to dark value", () => {
            applyThemeVariables("dark");
            expect(
                document.documentElement.style.getPropertyValue("--background"),
            ).toBe("30 12% 8%");
        });

        it("sets foreground to dark value", () => {
            applyThemeVariables("dark");
            expect(
                document.documentElement.style.getPropertyValue("--foreground"),
            ).toBe("40 30% 90%");
        });

        it("sets primary to dark value", () => {
            applyThemeVariables("dark");
            expect(
                document.documentElement.style.getPropertyValue("--primary"),
            ).toBe("14 65% 52%");
        });

        it("sets destructive to dark value", () => {
            applyThemeVariables("dark");
            expect(
                document.documentElement.style.getPropertyValue(
                    "--destructive",
                ),
            ).toBe("4 60% 50%");
        });

        it("sets border to dark value", () => {
            applyThemeVariables("dark");
            expect(
                document.documentElement.style.getPropertyValue("--border"),
            ).toBe("30 8% 22%");
        });

        it("sets radius", () => {
            applyThemeVariables("dark");
            expect(
                document.documentElement.style.getPropertyValue("--radius"),
            ).toBe("0.125rem");
        });
    });

    it("overwrites previous theme variables when switching", () => {
        applyThemeVariables("dark");
        expect(
            document.documentElement.style.getPropertyValue("--background"),
        ).toBe("30 12% 8%");

        applyThemeVariables("light");
        expect(
            document.documentElement.style.getPropertyValue("--background"),
        ).toBe("40 33% 94%");
    });

    it("applies all light variables to document root", () => {
        applyThemeVariables("light");
        const style = document.documentElement.style;
        expect(style.getPropertyValue("--secondary")).toBe("38 22% 88%");
        expect(style.getPropertyValue("--accent")).toBe("38 26% 86%");
        expect(style.getPropertyValue("--muted")).toBe("38 22% 90%");
        expect(style.getPropertyValue("--card")).toBe("42 44% 97%");
        expect(style.getPropertyValue("--popover")).toBe("42 44% 97%");
        expect(style.getPropertyValue("--ring")).toBe("14 60% 32%");
        expect(style.getPropertyValue("--input")).toBe("36 18% 78%");
    });

    it("applies all dark variables to document root", () => {
        applyThemeVariables("dark");
        const style = document.documentElement.style;
        expect(style.getPropertyValue("--secondary")).toBe("30 8% 18%");
        expect(style.getPropertyValue("--accent")).toBe("30 8% 20%");
        expect(style.getPropertyValue("--muted")).toBe("30 8% 16%");
        expect(style.getPropertyValue("--card")).toBe("30 10% 11%");
        expect(style.getPropertyValue("--popover")).toBe("30 10% 11%");
        expect(style.getPropertyValue("--ring")).toBe("14 65% 52%");
        expect(style.getPropertyValue("--input")).toBe("30 8% 26%");
        expect(style.getPropertyValue("--radius")).toBe("0.125rem");
    });
});
