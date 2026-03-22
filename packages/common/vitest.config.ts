import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        globals: true,
        environment: "node",
        coverage: {
            provider: "v8",
            reporter: ["text", "json-summary", "html", "lcov"],
            reportsDirectory: "./tests/.coverage",
            exclude: [
                // Pure TypeScript type declarations – no runtime code
                "src/types.ts",
                "src/types/**",
                "src/graphql/types.ts",
                // Build/tool config files
                "vitest.config.ts",
                "eslint.config.js",
            ],
        },
    },
});
