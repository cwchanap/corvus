import { defineConfig } from "wxt";
import solid from "vite-plugin-solid";

export default defineConfig({
  vite: () => ({
    plugins: [solid()],
  }),
  manifest: {
    name: "Corvus Wishlist",
    version: "1.0.0",
    description: "Save and organize your favorite web pages with categories",
    permissions: ["activeTab", "storage"],
    action: {
      default_popup: "popup/index.html",
      default_title: "Corvus Wishlist",
    },
  },
  // Enable src directory for better organization
  srcDir: "src",
});
