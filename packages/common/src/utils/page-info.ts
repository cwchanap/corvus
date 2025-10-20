export interface PageInfo {
  title: string;
  url: string;
  favicon?: string;
}

export async function getCurrentPageInfo(): Promise<PageInfo> {
  try {
    // Check if we're in a browser extension context
    type ChromeTab = { title?: string; url?: string; favIconUrl?: string };
    type ChromeTabs = {
      query(queryInfo: {
        active: boolean;
        currentWindow: boolean;
      }): Promise<ChromeTab[]>;
    };
    type ChromeLike = { tabs?: ChromeTabs };
    const chromeObj = (globalThis as { chrome?: ChromeLike }).chrome;
    if (chromeObj?.tabs) {
      const [tab] = await chromeObj.tabs.query({
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
