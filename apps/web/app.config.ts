import { defineConfig } from "@solidjs/start/config";

export default defineConfig({
  ssr: false, // Build as SPA
  server: {
    preset: "static",
  },
  vite: {
    css: {
      postcss: "./postcss.config.js",
    },
    server: {
      proxy: {
        "/api": {
          target: "http://localhost:5002",
          changeOrigin: true,
        },
      },
    },
  },
});
