import { cloudflare } from "@cloudflare/vite-plugin";
import { defineConfig } from "vite";
import vitePluginString from "vite-plugin-string";

export default defineConfig({
    plugins: [
        vitePluginString({
            include: "**/*.graphql",
        }),
        cloudflare({
            // Enable Node.js compatibility for Workers
            configPath: "./wrangler.jsonc",
        }),
    ],
    build: {
        outDir: "dist/corvus",
        emptyOutDir: true,
        rollupOptions: {
            input: "src/index.tsx",
        },
    },
    ssr: {
        target: "webworker",
        noExternal: true,
    },
});
