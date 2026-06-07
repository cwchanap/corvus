import { defineConfig } from "wxt";
import solid from "vite-plugin-solid";

export default defineConfig({
    vite: () => ({
        plugins: [solid()],
    }),
    publicDir: "../public",
    manifest: {
        // Public Chrome extension manifest key (RSA), safe to commit.
        // nosecret - intentionally public, used to pin the extension ID.
        key: "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA0j3plwLA7MAzVIjLK8T9OHTYF7hyKumWqM8lJHjiXG4PrKfRvyLtxjPB3ZI9zYJjWOYeRJ7YWPCGZ8mQWUjokSE97YezIdgMvDKRpNXPPi2Qn51p91sSDW6KHw0p3YVg0vJW8DGrx7ksCg/HlahrgvtxVBbgCucOlInWqy9xoyrIkhmIQBTYBfMRymWiD1U8QW5Crc3lPYDD9ze7xi7PsTkVmF1kt4Xnl3kWG+KueJ0ZQA5J1QACp3XObG/B9mxJ603WUMU0/OmQeiFzJ/KbzyKGbQ6q5dnJ5qGuqGUwVEBxtU6WcADl4/uhP2zr44E19jJrVLNH9S15XTES/1kZ1QIDAQAB",
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
