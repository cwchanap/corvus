import { defineConfig } from "@solidjs/start/config";

export default defineConfig({
  server: {
    preset: "cloudflare-pages",
  },
  vite: {
    css: {
      postcss: "./postcss.config.js",
    },
    server: {
      proxy: {
        "/api/*": "http://localhost:8787",
        "/admin/*": "http://localhost:8787",
        "/_actions/*": "http://localhost:8787",
      },
    },
  },
});
