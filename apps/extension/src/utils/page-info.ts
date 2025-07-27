export interface PageInfo {
  title: string;
  url: string;
  favicon?: string;
}

export async function getCurrentPageInfo(): Promise<PageInfo> {
  try {
    // Get current tab information
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    if (!tab) {
      throw new Error("No active tab found");
    }

    return {
      title: tab.title || "Untitled Page",
      url: tab.url || "",
      favicon: tab.favIconUrl,
    };
  } catch (error) {
    console.error("Error getting page info:", error);
    return {
      title: "Unknown Page",
      url: window.location?.href || "",
    };
  }
}
