import { defineConfig, coverageConfigDefaults } from "vitest/config";
import solid from "vite-plugin-solid";

export default defineConfig({
    plugins: [solid()],
    test: {
        environment: "jsdom",
        include: ["tests/**/*.{test,spec}.{ts,tsx}"],
        globals: true,
        setupFiles: ["./tests/setup.ts"],
        clearMocks: true,
        // solid-js and @solidjs/* must be inlined so all importers share ONE
        // instance of the Solid runtime. Without this, Vitest pre-bundles
        // @solidjs/testing-library with its own copy of solid-js, breaking
        // the reactive graph (signals set by component code don't notify
        // computations tracked by the other copy).
        deps: {
            inline: [/solid-js/, /@solidjs/],
        },
        coverage: {
            provider: "v8",
            reporter: ["text", "json-summary", "html", "lcov"],
            reportsDirectory: "./tests/.coverage",
            include: ["src/**/*.{ts,tsx}"],
            exclude: [
                ...coverageConfigDefaults.exclude,
                "src/entrypoints/**",
                "src/**/*.d.ts",
            ],
        },
    },
    resolve: {
        conditions: ["module", "browser", "development"],
        extensions: [".mjs", ".js", ".mts", ".ts", ".jsx", ".tsx", ".json"],
        dedupe: ["solid-js", "solid-js/web", "solid-js/store"],
    },
});
