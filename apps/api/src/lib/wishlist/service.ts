import type { DB } from "../db.js";
import type {
  WishlistCategory,
  NewWishlistCategory,
  WishlistCategoryUpdate,
  WishlistItem,
  NewWishlistItem,
  WishlistItemUpdate,
  WishlistItemLink,
  NewWishlistItemLink,
  WishlistItemLinkUpdate,
} from "../db/types.js";
import {
  wishlistCategories,
  wishlistItems,
  wishlistItemLinks,
} from "../db/schema.js";
import { and, asc, desc, eq } from "drizzle-orm";

export class WishlistService {
  constructor(private db: DB) {}

  // Category operations
  async getUserCategories(userId: number): Promise<WishlistCategory[]> {
    return await this.db
      .select()
      .from(wishlistCategories)
      .where(eq(wishlistCategories.user_id, userId))
      .orderBy(asc(wishlistCategories.created_at))
      .all();
  }

  async createCategory(
    categoryData: Omit<NewWishlistCategory, "id" | "created_at" | "updated_at">,
  ): Promise<WishlistCategory> {
    return await this.db
      .insert(wishlistCategories)
      .values({ id: crypto.randomUUID(), ...categoryData })
      .returning()
      .get();
  }

  async updateCategory(
    categoryId: string,
    updates: WishlistCategoryUpdate,
  ): Promise<WishlistCategory | null> {
    const row = await this.db
      .update(wishlistCategories)
      .set({ ...updates, updated_at: new Date().toISOString() })
      .where(eq(wishlistCategories.id, categoryId))
      .returning()
      .get();
    return row || null;
  }

  async deleteCategory(categoryId: string, userId: number): Promise<void> {
    // Get user's categories to find fallback
    const categories = await this.getUserCategories(userId);

    if (categories.length <= 1) {
      throw new Error("Cannot delete the last category");
    }

    const fallbackCategory = categories.find((cat) => cat.id !== categoryId);
    if (!fallbackCategory) {
      throw new Error("No fallback category found");
    }

    // Move items to fallback category
    await this.db
      .update(wishlistItems)
      .set({
        category_id: fallbackCategory.id,
        updated_at: new Date().toISOString(),
      })
      .where(
        and(
          eq(wishlistItems.category_id, categoryId),
          eq(wishlistItems.user_id, userId),
        ),
      )
      .run();

    // Delete the category
    await this.db
      .delete(wishlistCategories)
      .where(
        and(
          eq(wishlistCategories.id, categoryId),
          eq(wishlistCategories.user_id, userId),
        ),
      )
      .run();
  }

  // Item operations
  async getUserItems(userId: number): Promise<WishlistItem[]> {
    return await this.db
      .select()
      .from(wishlistItems)
      .where(eq(wishlistItems.user_id, userId))
      .orderBy(desc(wishlistItems.created_at))
      .all();
  }

  async getItemsByCategory(
    userId: number,
    categoryId: string,
  ): Promise<WishlistItem[]> {
    return await this.db
      .select()
      .from(wishlistItems)
      .where(
        and(
          eq(wishlistItems.user_id, userId),
          eq(wishlistItems.category_id, categoryId),
        ),
      )
      .orderBy(desc(wishlistItems.created_at))
      .all();
  }

  async createItem(
    itemData: Omit<NewWishlistItem, "id" | "created_at" | "updated_at">,
  ): Promise<WishlistItem> {
    return await this.db
      .insert(wishlistItems)
      .values({ id: crypto.randomUUID(), ...itemData })
      .returning()
      .get();
  }

  async updateItem(
    itemId: string,
    updates: WishlistItemUpdate,
  ): Promise<WishlistItem | null> {
    const row = await this.db
      .update(wishlistItems)
      .set({ ...updates, updated_at: new Date().toISOString() })
      .where(eq(wishlistItems.id, itemId))
      .returning()
      .get();
    return row || null;
  }

  async deleteItem(itemId: string, userId: number): Promise<void> {
    await this.db
      .delete(wishlistItems)
      .where(
        and(eq(wishlistItems.id, itemId), eq(wishlistItems.user_id, userId)),
      )
      .run();
  }

  // Item link operations
  async getItemLinks(itemId: string): Promise<WishlistItemLink[]> {
    return await this.db
      .select()
      .from(wishlistItemLinks)
      .where(eq(wishlistItemLinks.item_id, itemId))
      .orderBy(
        desc(wishlistItemLinks.is_primary),
        asc(wishlistItemLinks.created_at),
      )
      .all();
  }

  async createItemLink(
    linkData: Omit<NewWishlistItemLink, "id" | "created_at" | "updated_at">,
  ): Promise<WishlistItemLink> {
    return await this.db
      .insert(wishlistItemLinks)
      .values({ id: crypto.randomUUID(), ...linkData })
      .returning()
      .get();
  }

  async updateItemLink(
    linkId: string,
    updates: WishlistItemLinkUpdate,
  ): Promise<WishlistItemLink | null> {
    const row = await this.db
      .update(wishlistItemLinks)
      .set({ ...updates, updated_at: new Date().toISOString() })
      .where(eq(wishlistItemLinks.id, linkId))
      .returning()
      .get();
    return row || null;
  }

  async deleteItemLink(linkId: string): Promise<void> {
    await this.db
      .delete(wishlistItemLinks)
      .where(eq(wishlistItemLinks.id, linkId))
      .run();
  }

  async setPrimaryLink(itemId: string, linkId: string): Promise<void> {
    // First, unset all primary flags for this item
    await this.db
      .update(wishlistItemLinks)
      .set({ is_primary: false, updated_at: new Date().toISOString() })
      .where(eq(wishlistItemLinks.item_id, itemId))
      .run();

    // Then set the specific link as primary
    await this.db
      .update(wishlistItemLinks)
      .set({ is_primary: true, updated_at: new Date().toISOString() })
      .where(eq(wishlistItemLinks.id, linkId))
      .run();
  }

  // Combined operations
  async getUserWishlistData(userId: number) {
    const [categories, items] = await Promise.all([
      this.getUserCategories(userId),
      this.getUserItems(userId),
    ]);

    return { categories, items };
  }
}
