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
        typecheck: {
            enabled: false,
        },
    },
    resolve: {
        conditions: ["development", "browser"],
        extensions: [".ts", ".tsx", ".js", ".jsx"],
    },
});
