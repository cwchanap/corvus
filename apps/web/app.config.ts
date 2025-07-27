import { defineConfig } from "@solidjs/start/config";

export default defineConfig({
  server: {
    preset: "cloudflare-pages",
  },
  vite: {
    css: {
      postcss: "./postcss.config.js",
    },
  },
});
