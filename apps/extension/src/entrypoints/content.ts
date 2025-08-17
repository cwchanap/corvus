export default defineContentScript({
  matches: ["<all_urls>"],
  main() {
    console.log("Corvus Wishlist extension loaded!");

    // Content script is loaded and ready
    // The main functionality is in the popup
    // Expose a DOM signal so Playwright (page context) can verify activation
    try {
      document.documentElement.setAttribute("data-corvus-extension", "1");
    } catch {
      // no-op
    }
  },
});
