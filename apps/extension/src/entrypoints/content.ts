export default defineContentScript({
  matches: ['<all_urls>'],
  main() {
    console.log('Extension content script loaded!');
    
    // Example: Add a simple indicator to show the extension is active
    const indicator = document.createElement('div');
    indicator.textContent = '🚀 Extension Active';
    indicator.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      background: #007bff;
      color: white;
      padding: 8px 12px;
      border-radius: 4px;
      font-size: 12px;
      z-index: 10000;
      font-family: system-ui, sans-serif;
    `;
    
    document.body.appendChild(indicator);
    
    // Remove after 3 seconds
    setTimeout(() => {
      indicator.remove();
    }, 3000);
  },
});