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
import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import type { SQL } from "drizzle-orm";

type ItemQueryOptions = {
  limit?: number;
  offset?: number;
  categoryId?: string | null;
  search?: string | null;
};

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
    userId: number,
    updates: WishlistCategoryUpdate,
  ): Promise<WishlistCategory | null> {
    const row = await this.db
      .update(wishlistCategories)
      .set({ ...updates, updated_at: new Date().toISOString() })
      .where(
        and(
          eq(wishlistCategories.id, categoryId),
          eq(wishlistCategories.user_id, userId),
        ),
      )
      .returning()
      .get();
    return row || null;
  }

  async deleteCategory(categoryId: string, userId: number): Promise<void> {
    // Set category_id to null for all items in this category
    await this.db
      .update(wishlistItems)
      .set({
        category_id: null,
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
  private buildItemFilters(
    userId: number,
    options: ItemQueryOptions = {},
  ): SQL | undefined {
    const filters: SQL[] = [eq(wishlistItems.user_id, userId)];

    if (options.categoryId) {
      filters.push(eq(wishlistItems.category_id, options.categoryId));
    }

    if (options.search) {
      const pattern = `%${options.search}%`;
      filters.push(
        sql`(${wishlistItems.title} LIKE ${pattern} COLLATE NOCASE OR coalesce(${wishlistItems.description}, '') LIKE ${pattern} COLLATE NOCASE)`,
      );
    }

    return filters.length === 1 ? filters[0] : and(...filters);
  }

  async getUserItems(
    userId: number,
    options: ItemQueryOptions = {},
  ): Promise<WishlistItem[]> {
    const { limit, offset } = options;
    const filter = this.buildItemFilters(userId, options);

    const baseQuery = this.db
      .select()
      .from(wishlistItems)
      .where(filter)
      .orderBy(desc(wishlistItems.created_at));

    if (typeof limit === "number" && typeof offset === "number" && offset > 0) {
      return await baseQuery.limit(limit).offset(offset).all();
    }

    if (typeof limit === "number") {
      return await baseQuery.limit(limit).all();
    }

    if (typeof offset === "number" && offset > 0) {
      return await baseQuery.offset(offset).all();
    }

    return await baseQuery.all();
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

  async getUserItemsCount(
    userId: number,
    options: ItemQueryOptions = {},
  ): Promise<number> {
    const filter = this.buildItemFilters(userId, options);
    const result = await this.db
      .select({ value: sql<number>`count(*)` })
      .from(wishlistItems)
      .where(filter)
      .get();

    return result?.value ?? 0;
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
    userId: number,
    updates: WishlistItemUpdate,
  ): Promise<WishlistItem | null> {
    const row = await this.db
      .update(wishlistItems)
      .set({ ...updates, updated_at: new Date().toISOString() })
      .where(
        and(eq(wishlistItems.id, itemId), eq(wishlistItems.user_id, userId)),
      )
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
  async getUserWishlistData(userId: number, options: ItemQueryOptions = {}) {
    const { limit, offset = 0, categoryId, search } = options;

    const [categories, items, totalItems] = await Promise.all([
      this.getUserCategories(userId),
      this.getUserItems(userId, { limit, offset, categoryId, search }),
      this.getUserItemsCount(userId, { categoryId, search }),
    ]);

    const itemIds = items.map((item) => item.id);
    let linksByItemId: Record<string, WishlistItemLink[]> = {};

    if (itemIds.length > 0) {
      const links = await this.db
        .select()
        .from(wishlistItemLinks)
        .where(inArray(wishlistItemLinks.item_id, itemIds))
        .orderBy(
          desc(wishlistItemLinks.is_primary),
          asc(wishlistItemLinks.created_at),
        )
        .all();

      linksByItemId = links.reduce<Record<string, WishlistItemLink[]>>(
        (acc, link) => {
          const collection = acc[link.item_id] ?? [];
          collection.push(link);
          acc[link.item_id] = collection;
          return acc;
        },
        {},
      );
    }

    const itemsWithLinks = items.map((item) => ({
      ...item,
      links: linksByItemId[item.id] ?? [],
    }));

    const effectiveLimit =
      typeof limit === "number" && limit > 0
        ? limit
        : items.length > 0
          ? items.length
          : totalItems > 0
            ? totalItems
            : 0;

    const totalPages =
      effectiveLimit > 0 ? Math.ceil(totalItems / effectiveLimit) : 0;
    const currentPage =
      effectiveLimit > 0 ? Math.floor(offset / effectiveLimit) + 1 : 1;
    const normalizedPage =
      totalPages === 0 ? currentPage : Math.min(currentPage, totalPages);

    return {
      categories,
      items: itemsWithLinks,
      pagination: {
        total_items: totalItems,
        page: normalizedPage,
        page_size: effectiveLimit,
        total_pages: totalPages,
        has_next: normalizedPage < totalPages,
        has_previous: normalizedPage > 1 && totalPages > 0,
      },
    };
  }
}
