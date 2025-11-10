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
    },
    resolve: {
        conditions: ["development", "browser"],
    },
});
