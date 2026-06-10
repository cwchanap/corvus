import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

/**
 * Assertion test: verifies that the design tokens in the extension's
 * init-styles.ts stay in sync with the canonical source of truth in
 * packages/ui-components/src/styles.css.
 *
 * If this test fails, update init-styles.ts to match styles.css
 * (or vice versa if the change was intentional).
 */

const STYLES_CSS_PATH = path.resolve(
    __dirname,
    "../../../../../packages/ui-components/src/styles.css",
);
const INIT_STYLES_TS_PATH = path.resolve(
    __dirname,
    "../../../src/lib/theme/init-styles.ts",
);

function parseCssVariables(cssContent: string, selector: ":root" | ".dark") {
    const vars: Record<string, string> = {};
    // Match the block for the given selector (may be indented inside @layer)
    const selectorPattern =
        selector === ":root" ? /:root\s*\{/m : /\.dark\s*\{/m;
    const match = selectorPattern.exec(cssContent);
    if (!match) return vars;

    const start = match.index + match[0].length;
    let depth = 1;
    let end = start;
    for (; end < cssContent.length && depth > 0; end++) {
        if (cssContent[end] === "{") depth++;
        else if (cssContent[end] === "}") depth--;
    }

    const block = cssContent.slice(start, end - 1);
    const varRegex = /--([a-z-]+):\s*([^;]+);/g;
    let varMatch;
    while ((varMatch = varRegex.exec(block)) !== null) {
        vars[`--${varMatch[1]}`] = varMatch[2].trim();
    }
    return vars;
}

function parseTsThemeVars(tsContent: string, varName: string) {
    const vars: Record<string, string> = {};
    const regex = new RegExp(`const ${varName}\\s*=\\s*\\{([^}]+)\\}`, "s");
    const match = regex.exec(tsContent);
    if (!match) return vars;

    const block = match[1];
    const propRegex = /"([^"]+)":\s*"([^"]+)"/g;
    let propMatch;
    while ((propMatch = propRegex.exec(block)) !== null) {
        vars[propMatch[1]] = propMatch[2];
    }
    return vars;
}

describe("Design token sync: styles.css <-> init-styles.ts", () => {
    const cssContent = fs.readFileSync(STYLES_CSS_PATH, "utf-8");
    const tsContent = fs.readFileSync(INIT_STYLES_TS_PATH, "utf-8");

    const cssLight = parseCssVariables(cssContent, ":root");
    const cssDark = parseCssVariables(cssContent, ".dark");
    const tsLight = parseTsThemeVars(tsContent, "lightTheme");
    const tsDark = parseTsThemeVars(tsContent, "darkTheme");

    it("light theme tokens match between CSS and TypeScript", () => {
        const mismatches: string[] = [];
        const missing: string[] = [];

        for (const [key, cssValue] of Object.entries(cssLight)) {
            // Font tokens are CSS-only (not needed in extension runtime)
            if (key.startsWith("--font-")) continue;

            if (!(key in tsLight)) {
                missing.push(key);
            } else if (tsLight[key] !== cssValue) {
                mismatches.push(`${key}: CSS=${cssValue}, TS=${tsLight[key]}`);
            }
        }

        // Check for extra tokens in TS that aren't in CSS
        const extras = Object.keys(tsLight).filter(
            (k) => !(k in cssLight) && !k.startsWith("--font-"),
        );

        expect(
            mismatches,
            `Mismatched values: ${mismatches.join(", ")}`,
        ).toEqual([]);
        expect(
            missing,
            `Missing from init-styles.ts: ${missing.join(", ")}`,
        ).toEqual([]);
        expect(extras, `Extra in init-styles.ts: ${extras.join(", ")}`).toEqual(
            [],
        );
    });

    it("dark theme tokens match between CSS and TypeScript", () => {
        const mismatches: string[] = [];
        const missing: string[] = [];

        for (const [key, cssValue] of Object.entries(cssDark)) {
            if (key.startsWith("--font-")) continue;

            if (!(key in tsDark)) {
                missing.push(key);
            } else if (tsDark[key] !== cssValue) {
                mismatches.push(`${key}: CSS=${cssValue}, TS=${tsDark[key]}`);
            }
        }

        // --radius is theme-independent (only in :root CSS) but needed in
        // both TS theme objects for the extension's applyThemeVariables.
        const themeIndependentTokens = new Set(["--radius"]);

        const extras = Object.keys(tsDark).filter(
            (k) =>
                !(k in cssDark) &&
                !k.startsWith("--font-") &&
                !themeIndependentTokens.has(k),
        );

        expect(
            mismatches,
            `Mismatched values: ${mismatches.join(", ")}`,
        ).toEqual([]);
        expect(
            missing,
            `Missing from init-styles.ts: ${missing.join(", ")}`,
        ).toEqual([]);
        expect(extras, `Extra in init-styles.ts: ${extras.join(", ")}`).toEqual(
            [],
        );
    });

    it("radius token is present in both light and dark TS themes", () => {
        expect(tsLight).toHaveProperty("--radius");
        expect(tsDark).toHaveProperty("--radius");
        expect(tsLight["--radius"]).toBe(tsDark["--radius"]);
    });
});
