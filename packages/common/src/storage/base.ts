import type {
  WishlistData,
  WishlistCategory,
  WishlistItem,
} from "../types/wishlist.js";

export interface StorageAdapter {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

export const DEFAULT_CATEGORIES: WishlistCategory[] = [
  {
    id: "general",
    name: "General",
    color: "#6366f1",
    createdAt: new Date(),
  },
  {
    id: "work",
    name: "Work",
    color: "#059669",
    createdAt: new Date(),
  },
  {
    id: "personal",
    name: "Personal",
    color: "#dc2626",
    createdAt: new Date(),
  },
];

export class BaseWishlistStorage {
  private storageKey: string;
  private adapter: StorageAdapter;

  constructor(storageKey: string, adapter: StorageAdapter) {
    this.storageKey = storageKey;
    this.adapter = adapter;
  }

  async getWishlistData(): Promise<WishlistData> {
    try {
      const stored = await this.adapter.getItem(this.storageKey);
      if (!stored) {
        const defaultData: WishlistData = {
          categories: DEFAULT_CATEGORIES,
          items: [],
        };
        await this.saveWishlistData(defaultData);
        return defaultData;
      }

      const data = JSON.parse(stored) as WishlistData;
      // Convert date strings back to Date objects
      data.categories = data.categories.map((cat) => ({
        ...cat,
        createdAt: new Date(cat.createdAt),
      }));
      data.items = data.items.map((item) => ({
        ...item,
        createdAt: new Date(item.createdAt),
        updatedAt: new Date(item.updatedAt),
      }));

      return data;
    } catch (error) {
      console.error("Error loading wishlist data:", error);
      return {
        categories: DEFAULT_CATEGORIES,
        items: [],
      };
    }
  }

  async saveWishlistData(data: WishlistData): Promise<void> {
    try {
      await this.adapter.setItem(this.storageKey, JSON.stringify(data));
    } catch (error) {
      console.error("Error saving wishlist data:", error);
    }
  }

  async addItem(
    item: Omit<WishlistItem, "id" | "createdAt" | "updatedAt">,
  ): Promise<WishlistItem> {
    const data = await this.getWishlistData();
    const newItem: WishlistItem = {
      ...item,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    data.items.push(newItem);
    await this.saveWishlistData(data);
    return newItem;
  }

  async removeItem(itemId: string): Promise<void> {
    const data = await this.getWishlistData();
    data.items = data.items.filter((item) => item.id !== itemId);
    await this.saveWishlistData(data);
  }

  async updateItem(
    itemId: string,
    updates: Partial<Omit<WishlistItem, "id" | "createdAt">>,
  ): Promise<void> {
    const data = await this.getWishlistData();
    const itemIndex = data.items.findIndex((item) => item.id === itemId);

    if (itemIndex !== -1) {
      const current = data.items[itemIndex]!;
      const updated: WishlistItem = {
        ...current,
        updatedAt: new Date(),
      };

      if (updates.title !== undefined) updated.title = updates.title;
      if (updates.url !== undefined) updated.url = updates.url;
      if (updates.description !== undefined)
        updated.description = updates.description;
      if (updates.categoryId !== undefined)
        updated.categoryId = updates.categoryId;
      if (updates.favicon !== undefined) updated.favicon = updates.favicon;
      if (updates.userId !== undefined) updated.userId = updates.userId;

      data.items[itemIndex] = updated;
      await this.saveWishlistData(data);
    }
  }

  async addCategory(
    category: Omit<WishlistCategory, "id" | "createdAt">,
  ): Promise<WishlistCategory> {
    const data = await this.getWishlistData();
    const newCategory: WishlistCategory = {
      ...category,
      id: crypto.randomUUID(),
      createdAt: new Date(),
    };

    data.categories.push(newCategory);
    await this.saveWishlistData(data);
    return newCategory;
  }

  async removeCategory(categoryId: string): Promise<void> {
    const data = await this.getWishlistData();

    // Don't allow removing the last category
    if (data.categories.length <= 1) {
      throw new Error("Cannot remove the last category");
    }

    // Move items from deleted category to the first remaining category
    const remainingCategories = data.categories.filter(
      (cat) => cat.id !== categoryId,
    );
    const fallbackCategoryId = remainingCategories[0]?.id;

    if (fallbackCategoryId) {
      data.items = data.items.map((item) =>
        item.categoryId === categoryId
          ? { ...item, categoryId: fallbackCategoryId, updatedAt: new Date() }
          : item,
      );
    }

    data.categories = remainingCategories;
    await this.saveWishlistData(data);
  }
}
