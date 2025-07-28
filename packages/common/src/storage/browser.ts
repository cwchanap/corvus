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

// Extension storage adapter
export class ExtensionStorageAdapter implements StorageAdapter {
  async getItem(key: string): Promise<string | null> {
    if (typeof chrome !== "undefined" && chrome.storage) {
      const result = await chrome.storage.local.get(key);
      return result[key] || null;
    }
    // Fallback to localStorage
    return localStorage.getItem(key);
  }

  async setItem(key: string, value: string): Promise<void> {
    if (typeof chrome !== "undefined" && chrome.storage) {
      await chrome.storage.local.set({ [key]: value });
    } else {
      // Fallback to localStorage
      localStorage.setItem(key, value);
    }
  }

  async removeItem(key: string): Promise<void> {
    if (typeof chrome !== "undefined" && chrome.storage) {
      await chrome.storage.local.remove(key);
    } else {
      // Fallback to localStorage
      localStorage.removeItem(key);
    }
  }
}

// Factory function for creating storage instances
export function createWishlistStorage(storageKey = "corvus_wishlist") {
  const adapter =
    typeof chrome !== "undefined" && chrome.storage
      ? new ExtensionStorageAdapter()
      : new LocalStorageAdapter();

  return new BaseWishlistStorage(storageKey, adapter);
}
