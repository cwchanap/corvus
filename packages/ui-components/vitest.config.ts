import { defineConfig, coverageConfigDefaults } from "vitest/config";
import solid from "vite-plugin-solid";

export default defineConfig({
    plugins: [solid()],
    test: {
        environment: "jsdom",
        globals: true,
        setupFiles: ["./tests/setup.ts"],
        coverage: {
            provider: "v8",
            reporter: ["text", "json-summary", "html", "lcov"],
            reportsDirectory: "./tests/.coverage",
            exclude: [
                ...coverageConfigDefaults.exclude,
                "vitest.config.ts",
                "tailwind.config.js",
                "eslint.config.js",
                "postcss.config.js",
                "src/**/*.d.ts",
            ],
        },
    },
    resolve: {
        conditions: ["development", "browser"],
        extensions: [".ts", ".tsx", ".js", ".jsx"],
    },
});
