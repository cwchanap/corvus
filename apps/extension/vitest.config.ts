import { defineConfig } from "vitest/config";
import solid from "vite-plugin-solid";

export default defineConfig({
    plugins: [solid()],
    test: {
        environment: "jsdom",
        globals: true,
        coverage: {
            provider: "v8",
            reporter: ["text", "json-summary", "html", "lcov"],
            reportsDirectory: "./tests/.coverage",
        },
    },
});
