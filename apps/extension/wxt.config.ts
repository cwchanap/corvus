import { defineConfig } from "wxt";
import solid from "vite-plugin-solid";

export default defineConfig({
    vite: () => ({
        plugins: [solid()],
    }),
    manifest: {
        name: "Corvus Wishlist",
        version: "1.0.0",
        description:
            "Save and organize your favorite web pages with categories",
        icons: {
            16: "/icon-16.png",
            24: "/icon-24.png",
            32: "/icon-32.png",
            48: "/icon-48.png",
            96: "/icon-96.png",
            128: "/icon-128.png",
        },
        permissions: ["activeTab", "storage"],
        action: {
            default_popup: "popup/index.html",
            default_title: "Corvus Wishlist",
            default_icon: {
                16: "/icon-16.png",
                24: "/icon-24.png",
                32: "/icon-32.png",
                48: "/icon-48.png",
                96: "/icon-96.png",
                128: "/icon-128.png",
            },
        },
    },
    // Enable src directory for better organization
    srcDir: "src",
});
