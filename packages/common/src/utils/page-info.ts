import type { PageInfo } from "../types/wishlist.js";

export async function getCurrentPageInfo(): Promise<PageInfo> {
  try {
    // Check if we're in a browser extension context
    if (typeof chrome !== "undefined" && chrome.tabs) {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      if (tab) {
        return {
          title: tab.title || "Untitled Page",
          url: tab.url || "",
          favicon: tab.favIconUrl,
        };
      }
    }

    // Fallback for web context
    if (typeof window !== "undefined") {
      return {
        title: document.title || "Untitled Page",
        url: window.location.href,
        favicon: getFaviconUrl(),
      };
    }

    throw new Error("Unable to get page info");
  } catch (error) {
    console.error("Error getting page info:", error);
    return {
      title: "Unknown Page",
      url: typeof window !== "undefined" ? window.location?.href || "" : "",
    };
  }
}

function getFaviconUrl(): string | undefined {
  if (typeof document === "undefined") return undefined;

  // Try to find favicon link
  const faviconLink = document.querySelector(
    'link[rel*="icon"]',
  ) as HTMLLinkElement;
  if (faviconLink?.href) {
    return faviconLink.href;
  }

  // Fallback to default favicon path
  const { protocol, hostname, port } = window.location;
  const portSuffix = port ? `:${port}` : "";
  return `${protocol}//${hostname}${portSuffix}/favicon.ico`;
}
