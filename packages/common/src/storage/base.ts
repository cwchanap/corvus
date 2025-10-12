import type {
  WishlistData,
  WishlistCategory,
  WishlistItem,
  WishlistItemLink,
  WishlistPagination,
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
          pagination: buildPagination([]),
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

      // Handle backward compatibility and ensure links are properly structured
      data.items = data.items.map((item) => {
        const baseItem = {
          ...item,
          createdAt: new Date(item.createdAt),
          updatedAt: new Date(item.updatedAt),
        };

        // Migration: if item has old 'url' property, convert it to a link
        if ("url" in item && item.url && typeof item.url === "string") {
          const legacyItem = item as WishlistItem & { url: string };
          if (!baseItem.links) {
            baseItem.links = [];
          }
          // Only add the link if it doesn't already exist
          const hasExistingLink = baseItem.links.some(
            (link) => link.url === legacyItem.url,
          );
          if (!hasExistingLink) {
            baseItem.links.push({
              id: crypto.randomUUID(),
              itemId: baseItem.id,
              url: legacyItem.url,
              description: undefined,
              isPrimary: true,
              createdAt: new Date(baseItem.createdAt),
              updatedAt: new Date(baseItem.updatedAt),
            });
          }
        }

        // Ensure links have proper date objects
        if (baseItem.links) {
          baseItem.links = baseItem.links.map((link) => ({
            ...link,
            createdAt: new Date(link.createdAt),
            updatedAt: new Date(link.updatedAt),
          }));
        }

        return baseItem;
      });

      data.pagination = buildPagination(data.items);

      return data;
    } catch (error) {
      console.error("Error loading wishlist data:", error);
      return {
        categories: DEFAULT_CATEGORIES,
        items: [],
        pagination: buildPagination([]),
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
    data.pagination = buildPagination(data.items);
    await this.saveWishlistData(data);
    return newItem;
  }

  async addItemWithLink(
    item: Omit<WishlistItem, "id" | "createdAt" | "updatedAt">,
    url: string,
    linkDescription?: string,
  ): Promise<{ item: WishlistItem; link: WishlistItemLink }> {
    const data = await this.getWishlistData();
    const newItem: WishlistItem = {
      ...item,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const newLink: WishlistItemLink = {
      id: crypto.randomUUID(),
      itemId: newItem.id,
      url,
      description: linkDescription,
      isPrimary: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    data.items.push(newItem);
    data.pagination = buildPagination(data.items);

    // Store links in a separate property or alongside the item
    // For browser storage, we'll add them to the item directly
    newItem.links = [newLink];

    await this.saveWishlistData(data);
    return { item: newItem, link: newLink };
  }

  async removeItem(itemId: string): Promise<void> {
    const data = await this.getWishlistData();
    data.items = data.items.filter((item) => item.id !== itemId);
    data.pagination = buildPagination(data.items);
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
      if (updates.description !== undefined)
        updated.description = updates.description;
      if (updates.categoryId !== undefined)
        updated.categoryId = updates.categoryId;
      if (updates.favicon !== undefined) updated.favicon = updates.favicon;
      if (updates.userId !== undefined) updated.userId = updates.userId;
      if (updates.links !== undefined) updated.links = updates.links;

      data.items[itemIndex] = updated;
      data.pagination = buildPagination(data.items);
      await this.saveWishlistData(data);
    }
  }

  // Link management methods
  async addItemLink(
    itemId: string,
    url: string,
    description?: string,
    isPrimary: boolean = false,
  ): Promise<WishlistItemLink> {
    const data = await this.getWishlistData();
    const item = data.items.find((item) => item.id === itemId);

    if (!item) {
      throw new Error("Item not found");
    }

    const newLink: WishlistItemLink = {
      id: crypto.randomUUID(),
      itemId,
      url,
      description,
      isPrimary,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    if (!item.links) {
      item.links = [];
    }

    // If this is set as primary, unset others
    if (isPrimary) {
      item.links.forEach((link) => (link.isPrimary = false));
    }

    item.links.push(newLink);
    item.updatedAt = new Date();

    await this.saveWishlistData(data);
    return newLink;
  }

  async updateItemLink(
    itemId: string,
    linkId: string,
    updates: Partial<Omit<WishlistItemLink, "id" | "itemId" | "createdAt">>,
  ): Promise<void> {
    const data = await this.getWishlistData();
    const item = data.items.find((item) => item.id === itemId);

    if (!item?.links) {
      return;
    }

    const linkIndex = item.links.findIndex((link) => link.id === linkId);
    if (linkIndex !== -1) {
      const current = item.links[linkIndex]!;
      const updated: WishlistItemLink = {
        ...current,
        ...updates,
        updatedAt: new Date(),
      };

      // If setting as primary, unset others
      if (updates.isPrimary === true) {
        item.links.forEach((link) => {
          if (link.id !== linkId) {
            link.isPrimary = false;
          }
        });
      }

      item.links[linkIndex] = updated;
      item.updatedAt = new Date();
      await this.saveWishlistData(data);
    }
  }

  async removeItemLink(itemId: string, linkId: string): Promise<void> {
    const data = await this.getWishlistData();
    const item = data.items.find((item) => item.id === itemId);

    if (!item?.links) {
      return;
    }

    item.links = item.links.filter((link) => link.id !== linkId);
    item.updatedAt = new Date();
    await this.saveWishlistData(data);
  }

  async setPrimaryLink(itemId: string, linkId: string): Promise<void> {
    await this.updateItemLink(itemId, linkId, { isPrimary: true });
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

function buildPagination(items: WishlistItem[]): WishlistPagination {
  const totalItems = items.length;
  const pageSize = totalItems;
  const totalPages = totalItems === 0 ? 0 : 1;

  return {
    totalItems,
    page: totalPages === 0 ? 1 : 1,
    pageSize,
    totalPages,
    hasNext: false,
    hasPrevious: false,
  };
}
