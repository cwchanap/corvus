export default defineContentScript({
  matches: ["<all_urls>"],
  main() {
    console.log("Corvus Wishlist extension loaded!");

    // Content script is loaded and ready
    // The main functionality is in the popup
  },
});
