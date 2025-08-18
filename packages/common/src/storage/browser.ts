import { BaseWishlistStorage, type StorageAdapter } from "./base.js";

// Browser localStorage adapter
export class LocalStorageAdapter implements StorageAdapter {
  async getItem(key: string): Promise<string | null> {
    return localStorage.getItem(key);
  }

  async setItem(key: string, value: string): Promise<void> {
    localStorage.setItem(key, value);
  }

  async removeItem(key: string): Promise<void> {
    localStorage.removeItem(key);
  }
}

// Minimal Chrome-like types we use (no dependency on @types/chrome required)
type ChromeStorageLocal = {
  get(key: string): Promise<Record<string, string | undefined>>;
  set(items: Record<string, string>): Promise<void>;
  remove(key: string): Promise<void>;
};

type ChromeLike = {
  storage?: { local: ChromeStorageLocal };
};

// Extension storage adapter
export class ExtensionStorageAdapter implements StorageAdapter {
  async getItem(key: string): Promise<string | null> {
    const chromeObj = (globalThis as { chrome?: ChromeLike }).chrome;
    if (chromeObj?.storage) {
      const result = await chromeObj.storage.local.get(key);
      return result[key] || null;
    }
    // Fallback to localStorage
    return localStorage.getItem(key);
  }

  async setItem(key: string, value: string): Promise<void> {
    const chromeObj = (globalThis as { chrome?: ChromeLike }).chrome;
    if (chromeObj?.storage) {
      await chromeObj.storage.local.set({ [key]: value });
    } else {
      // Fallback to localStorage
      localStorage.setItem(key, value);
    }
  }

  async removeItem(key: string): Promise<void> {
    const chromeObj = (globalThis as { chrome?: ChromeLike }).chrome;
    if (chromeObj?.storage) {
      await chromeObj.storage.local.remove(key);
    } else {
      // Fallback to localStorage
      localStorage.removeItem(key);
    }
  }
}

// Factory function for creating storage instances
export function createWishlistStorage(storageKey = "corvus_wishlist") {
  const chromeObj = (globalThis as { chrome?: ChromeLike }).chrome;
  const adapter = chromeObj?.storage
    ? new ExtensionStorageAdapter()
    : new LocalStorageAdapter();

  return new BaseWishlistStorage(storageKey, adapter);
}
