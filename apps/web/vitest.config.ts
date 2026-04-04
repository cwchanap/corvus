import { defineConfig } from "vitest/config";
import solid from "vite-plugin-solid";

export default defineConfig({
    plugins: [solid()],
    test: {
        environment: "jsdom",
        include: ["src/**/*.{test,spec}.{ts,tsx}"],
        globals: true,
        setupFiles: ["./src/test-setup.ts"],
        clearMocks: true,
        coverage: {
            provider: "v8",
            reporter: ["text", "json-summary", "html", "lcov"],
            reportsDirectory: "./tests/.coverage",
            exclude: [
                "app.config.ts",
                "postcss.config.js",
                "tailwind.config.js",
                "vitest.config.ts",
                "eslint.config.js",
                "scripts/**",
                "src/entry-client.tsx",
                "src/entry-server.tsx",
                "src/app.tsx",
                "src/**/*.d.ts",
            ],
        },
        typecheck: {
            enabled: false,
        },
    },
    resolve: {
        conditions: ["development", "browser"],
        extensions: [".ts", ".tsx", ".js", ".jsx"],
    },
});
