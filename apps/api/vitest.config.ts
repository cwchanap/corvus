import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        globals: true,
        environment: "node",
        setupFiles: ["./tests/setup.ts"],
        coverage: {
            provider: "v8",
            reporter: ["text", "json-summary", "html", "lcov"],
            reportsDirectory: "./tests/.coverage",
            exclude: [
                // Pure TypeScript type declarations with no runtime code
                "src/lib/db/types.ts",
                // Ambient type declarations – no runtime code
                "src/**/*.d.ts",
                // Build/tool config files not part of the app runtime
                "codegen.ts",
                "drizzle.config.ts",
                "vite.config.ts",
                "vitest.config.ts",
            ],
        },
    },
});
