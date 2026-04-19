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
        conditions: ["module", "browser", "development|production"],
        extensions: [".mjs", ".js", ".mts", ".ts", ".jsx", ".tsx", ".json"],
    },
});
