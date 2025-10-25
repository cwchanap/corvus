import { cloudflare } from "@cloudflare/vite-plugin";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    cloudflare({
      // Enable Node.js compatibility for Workers
      configPath: "./wrangler.jsonc",
    }),
  ],
  build: {
    rollupOptions: {
      input: "src/index.tsx",
    },
  },
  ssr: {
    target: "webworker",
    noExternal: true,
  },
});
