import type { Kysely } from "kysely";
import type {
  Database,
  WishlistCategory,
  NewWishlistCategory,
  WishlistCategoryUpdate,
  WishlistItem,
  NewWishlistItem,
  WishlistItemUpdate,
} from "../db/types";

export class WishlistService {
  constructor(private db: Kysely<Database>) {}

  // Category operations
  async getUserCategories(userId: number): Promise<WishlistCategory[]> {
    return await this.db
      .selectFrom("wishlist_categories")
      .selectAll()
      .where("user_id", "=", userId)
      .orderBy("created_at", "asc")
      .execute();
  }

  async createCategory(
    categoryData: Omit<NewWishlistCategory, "id" | "created_at" | "updated_at">,
  ): Promise<WishlistCategory> {
    return await this.db
      .insertInto("wishlist_categories")
      .values({
        id: crypto.randomUUID(),
        ...categoryData,
      })
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  async updateCategory(
    categoryId: string,
    updates: WishlistCategoryUpdate,
  ): Promise<WishlistCategory | null> {
    return (
      (await this.db
        .updateTable("wishlist_categories")
        .set({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .where("id", "=", categoryId)
        .returningAll()
        .executeTakeFirst()) || null
    );
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
      .updateTable("wishlist_items")
      .set({
        category_id: fallbackCategory.id,
        updated_at: new Date().toISOString(),
      })
      .where("category_id", "=", categoryId)
      .where("user_id", "=", userId)
      .execute();

    // Delete the category
    await this.db
      .deleteFrom("wishlist_categories")
      .where("id", "=", categoryId)
      .where("user_id", "=", userId)
      .execute();
  }

  // Item operations
  async getUserItems(userId: number): Promise<WishlistItem[]> {
    return await this.db
      .selectFrom("wishlist_items")
      .selectAll()
      .where("user_id", "=", userId)
      .orderBy("created_at", "desc")
      .execute();
  }

  async getItemsByCategory(
    userId: number,
    categoryId: string,
  ): Promise<WishlistItem[]> {
    return await this.db
      .selectFrom("wishlist_items")
      .selectAll()
      .where("user_id", "=", userId)
      .where("category_id", "=", categoryId)
      .orderBy("created_at", "desc")
      .execute();
  }

  async createItem(
    itemData: Omit<NewWishlistItem, "id" | "created_at" | "updated_at">,
  ): Promise<WishlistItem> {
    return await this.db
      .insertInto("wishlist_items")
      .values({
        id: crypto.randomUUID(),
        ...itemData,
      })
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  async updateItem(
    itemId: string,
    updates: WishlistItemUpdate,
  ): Promise<WishlistItem | null> {
    return (
      (await this.db
        .updateTable("wishlist_items")
        .set({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .where("id", "=", itemId)
        .returningAll()
        .executeTakeFirst()) || null
    );
  }

  async deleteItem(itemId: string, userId: number): Promise<void> {
    await this.db
      .deleteFrom("wishlist_items")
      .where("id", "=", itemId)
      .where("user_id", "=", userId)
      .execute();
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
