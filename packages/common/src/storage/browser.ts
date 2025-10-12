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

type ExtensionStorage = {
  get(key: string): Promise<Record<string, string | undefined>>;
  set(items: Record<string, string>): Promise<void>;
  remove(key: string): Promise<void>;
};

type BrowserLike = {
  storage?: { local?: ExtensionStorage };
};

type ChromeStorageLocalCallbacks = {
  get(
    keys: string | string[] | Record<string, unknown>,
    callback: (items: Record<string, string | undefined>) => void,
  ): void;
  set(items: Record<string, string>, callback?: () => void): void;
  remove(keys: string | string[], callback?: () => void): void;
};

type ChromeLike = {
  storage?: { local?: ChromeStorageLocalCallbacks };
  runtime?: { lastError?: unknown };
};

const cachedExtensionStorage = (() => {
  let storage: ExtensionStorage | null | undefined;

  return () => {
    if (storage !== undefined) {
      return storage;
    }

    const globalObj = globalThis as {
      browser?: BrowserLike;
      chrome?: ChromeLike;
    };

    const browserStorage = globalObj.browser?.storage?.local;
    if (browserStorage) {
      storage = browserStorage;
      return storage;
    }

    const chromeStorage = globalObj.chrome?.storage?.local;
    if (chromeStorage) {
      const promisify = <T>(
        method: (...args: unknown[]) => void,
        ...args: unknown[]
      ): Promise<T> => {
        return new Promise<T>((resolve, reject) => {
          try {
            method.call(chromeStorage, ...args, (result: T) => {
              const error = globalObj.chrome?.runtime?.lastError;
              if (error) {
                reject(error);
              } else {
                resolve(result);
              }
            });
          } catch (error) {
            reject(error);
          }
        });
      };

      storage = {
        get: (key: string) =>
          promisify<Record<string, string | undefined>>(chromeStorage.get, key),
        set: (items: Record<string, string>) =>
          promisify<void>(chromeStorage.set, items),
        remove: (key: string) => promisify<void>(chromeStorage.remove, key),
      };

      return storage;
    }

    storage = null;
    return storage;
  };
})();

function resolveExtensionStorage(): ExtensionStorage | null {
  return cachedExtensionStorage();
}

// Extension storage adapter
export class ExtensionStorageAdapter implements StorageAdapter {
  constructor(private readonly storage: ExtensionStorage) {}

  async getItem(key: string): Promise<string | null> {
    const result = await this.storage.get(key);
    return result[key] ?? null;
  }

  async setItem(key: string, value: string): Promise<void> {
    await this.storage.set({ [key]: value });
  }

  async removeItem(key: string): Promise<void> {
    await this.storage.remove(key);
  }
}

// Factory function for creating storage instances
export function createWishlistStorage(storageKey = "corvus_wishlist") {
  const extensionStorage = resolveExtensionStorage();
  const adapter = extensionStorage
    ? new ExtensionStorageAdapter(extensionStorage)
    : new LocalStorageAdapter();

  return new BaseWishlistStorage(storageKey, adapter);
}
