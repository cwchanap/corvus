import type { DB } from "../db";
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
} from "../db/types";
import {
    wishlistCategories,
    wishlistItems,
    wishlistItemLinks,
} from "../db/schema";
import { and, asc, desc, eq, inArray, ne, sql } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import type { WishlistSortKey, SortDirection } from "../../graphql/types";

export class WishlistAuthorizationError extends Error {
    constructor(message = "Not authorized") {
        super(message);
        this.name = "WishlistAuthorizationError";
    }
}

type ItemQueryOptions = {
    limit?: number;
    offset?: number;
    categoryId?: string | null;
    search?: string | null;
    /** Specific status to filter by. Set to "ALL" to include archived items. Omit to exclude archived. */
    status?: string | null;
    sortBy?: WishlistSortKey | null;
    sortDir?: SortDirection | null;
};

export class WishlistService {
    constructor(private db: DB) {}

    private async assertItemOwnedByUser(
        requesterUserId: string,
        itemId: string,
    ): Promise<void> {
        const item = await this.db
            .select({ user_id: wishlistItems.user_id })
            .from(wishlistItems)
            .where(eq(wishlistItems.id, itemId))
            .get();

        if (!item || item.user_id !== requesterUserId) {
            throw new WishlistAuthorizationError();
        }
    }

    // Category operations
    async getUserCategories(userId: string): Promise<WishlistCategory[]> {
        return await this.db
            .select()
            .from(wishlistCategories)
            .where(eq(wishlistCategories.user_id, userId))
            .orderBy(asc(wishlistCategories.created_at))
            .all();
    }

    async createCategory(
        categoryData: Omit<
            NewWishlistCategory,
            "id" | "created_at" | "updated_at"
        >,
    ): Promise<WishlistCategory> {
        const insertedCategory = await this.db
            .insert(wishlistCategories)
            .values({ id: crypto.randomUUID(), ...categoryData })
            .onConflictDoNothing({
                target: [wishlistCategories.user_id, wishlistCategories.name],
            })
            .returning()
            .get();

        if (insertedCategory) {
            return insertedCategory;
        }

        const existingCategory = await this.db
            .select()
            .from(wishlistCategories)
            .where(
                and(
                    eq(wishlistCategories.user_id, categoryData.user_id),
                    eq(wishlistCategories.name, categoryData.name),
                ),
            )
            .get();

        if (!existingCategory) {
            throw new Error(
                "Category insert conflicted but the existing category could not be loaded.",
            );
        }

        return existingCategory;
    }

    async updateCategory(
        categoryId: string,
        userId: string,
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

    async deleteCategory(categoryId: string, userId: string): Promise<void> {
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
    private escapeLikePattern(pattern: string): string {
        return pattern
            .replaceAll("\\", "\\\\")
            .replaceAll("%", "\\%")
            .replaceAll("_", "\\_");
    }

    private buildItemFilters(
        userId: string,
        options: ItemQueryOptions = {},
    ): SQL | undefined {
        const filters: SQL[] = [eq(wishlistItems.user_id, userId)];

        if (options.categoryId) {
            filters.push(eq(wishlistItems.category_id, options.categoryId));
        }

        if (options.status && options.status !== "ALL") {
            filters.push(
                eq(
                    wishlistItems.status,
                    options.status as "want" | "purchased" | "archived",
                ),
            );
        } else if (!options.status) {
            // Exclude archived items by default
            filters.push(
                ne(
                    wishlistItems.status,
                    "archived" as "want" | "purchased" | "archived",
                ),
            );
        }
        // options.status === "ALL" → no status filter applied

        if (options.search) {
            const escaped = this.escapeLikePattern(options.search);
            const pattern = `%${escaped}%`;
            filters.push(
                sql`(${wishlistItems.title} LIKE ${pattern} COLLATE NOCASE ESCAPE '\\' OR coalesce(${wishlistItems.description}, '') LIKE ${pattern} COLLATE NOCASE ESCAPE '\\')`,
            );
        }

        return filters.length === 1 ? filters[0] : and(...filters);
    }

    async getUserItems(
        userId: string,
        options: ItemQueryOptions = {},
    ): Promise<WishlistItem[]> {
        const { limit, offset, sortBy, sortDir } = options;
        const filter = this.buildItemFilters(userId, options);

        // Build base query with proper type
        const query = this.db.select().from(wishlistItems).where(filter);

        // Apply sorting based on enum values
        let orderedQuery;

        // Default to DESC whenever sortDir is omitted to match the GraphQL contract.
        const isDescending = sortDir === "DESC" || !sortDir;

        if (sortBy === "PRIORITY") {
            // PRIORITY: nulls last, ascending (1 = highest priority)
            orderedQuery = query.orderBy(
                sql`${wishlistItems.priority} IS NULL`,
                isDescending
                    ? desc(wishlistItems.priority)
                    : asc(wishlistItems.priority),
            );
        } else {
            // Map sort keys to database columns
            // Note: NAME is intended for categories, not items - falls back to CREATED_AT for items
            const getSortColumn = (sortKey?: WishlistSortKey | null) => {
                switch (sortKey) {
                    case "CREATED_AT":
                        return wishlistItems.created_at;
                    case "UPDATED_AT":
                        return wishlistItems.updated_at;
                    case "TITLE":
                        return wishlistItems.title;
                    default:
                        return wishlistItems.created_at;
                }
            };

            const sortColumn = getSortColumn(sortBy);

            if (isDescending) {
                orderedQuery = query.orderBy(desc(sortColumn));
            } else {
                orderedQuery = query.orderBy(asc(sortColumn));
            }
        }

        if (
            typeof limit === "number" &&
            typeof offset === "number" &&
            offset > 0
        ) {
            return await orderedQuery.limit(limit).offset(offset).all();
        }

        if (typeof limit === "number") {
            return await orderedQuery.limit(limit).all();
        }

        if (typeof offset === "number" && offset > 0) {
            return await orderedQuery.offset(offset).all();
        }

        return await orderedQuery.all();
    }

    async getItemsByCategory(
        userId: string,
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

    async getItemById(
        userId: string,
        itemId: string,
    ): Promise<WishlistItem | undefined> {
        return await this.db
            .select()
            .from(wishlistItems)
            .where(
                and(
                    eq(wishlistItems.id, itemId),
                    eq(wishlistItems.user_id, userId),
                ),
            )
            .get();
    }

    async getUserItemsCount(
        userId: string,
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

    async checkDuplicateUrl(
        userId: string,
        url: string,
        excludeItemId?: string,
    ): Promise<{ isDuplicate: boolean; conflictingItem: WishlistItem | null }> {
        const conditions = [
            eq(wishlistItemLinks.url, url),
            eq(wishlistItems.user_id, userId),
        ];

        if (excludeItemId) {
            conditions.push(ne(wishlistItems.id, excludeItemId));
        }

        const result = await this.db
            .select({ item: wishlistItems })
            .from(wishlistItemLinks)
            .innerJoin(
                wishlistItems,
                eq(wishlistItemLinks.item_id, wishlistItems.id),
            )
            .where(and(...conditions))
            .limit(1)
            .get();

        if (!result) {
            return { isDuplicate: false, conflictingItem: null };
        }

        return { isDuplicate: true, conflictingItem: result.item };
    }

    async getRecentItems(
        userId: string,
        limit = 5,
    ): Promise<Array<WishlistItem & { links: WishlistItemLink[] }>> {
        const items = await this.db
            .select()
            .from(wishlistItems)
            .where(
                and(
                    eq(wishlistItems.user_id, userId),
                    ne(
                        wishlistItems.status,
                        "archived" as "want" | "purchased" | "archived",
                    ),
                ),
            )
            .orderBy(desc(wishlistItems.created_at))
            .limit(limit)
            .all();

        if (items.length === 0) {
            return [];
        }

        const itemIds = items.map((item) => item.id);
        const links = await this.db
            .select()
            .from(wishlistItemLinks)
            .where(inArray(wishlistItemLinks.item_id, itemIds))
            .orderBy(
                desc(wishlistItemLinks.is_primary),
                asc(wishlistItemLinks.created_at),
            )
            .all();

        const linksByItemId = links.reduce<Record<string, WishlistItemLink[]>>(
            (acc, link) => {
                const collection = acc[link.item_id] ?? [];
                collection.push(link);
                acc[link.item_id] = collection;
                return acc;
            },
            {},
        );

        return items.map((item) => ({
            ...item,
            links: linksByItemId[item.id] ?? [],
        }));
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

    /**
     * Create an item with its primary link in a single atomic transaction.
     * If the link creation fails, the item is also rolled back.
     */
    async createItemWithPrimaryLink(
        itemData: Omit<NewWishlistItem, "id" | "created_at" | "updated_at">,
        linkData: Omit<
            NewWishlistItemLink,
            "id" | "item_id" | "created_at" | "updated_at"
        >,
    ): Promise<{ item: WishlistItem; link: WishlistItemLink }> {
        const itemId = crypto.randomUUID();
        const linkId = crypto.randomUUID();

        // Use db.batch() for atomic transaction
        const [itemResult, linkResult] = await this.db.batch([
            this.db
                .insert(wishlistItems)
                .values({ id: itemId, ...itemData })
                .returning(),
            this.db
                .insert(wishlistItemLinks)
                .values({ id: linkId, item_id: itemId, ...linkData })
                .returning(),
        ]);

        const item = itemResult[0];
        const link = linkResult[0];

        if (!item || !link) {
            throw new Error(
                `createItemWithPrimaryLink: batch insert returned no rows. itemResult.length=${itemResult.length}, linkResult.length=${linkResult.length}`,
            );
        }

        return { item, link };
    }

    async updateItem(
        itemId: string,
        userId: string,
        updates: WishlistItemUpdate,
    ): Promise<WishlistItem | null> {
        const row = await this.db
            .update(wishlistItems)
            .set({ ...updates, updated_at: new Date().toISOString() })
            .where(
                and(
                    eq(wishlistItems.id, itemId),
                    eq(wishlistItems.user_id, userId),
                ),
            )
            .returning()
            .get();
        return row || null;
    }

    async deleteItem(itemId: string, userId: string): Promise<void> {
        await this.db
            .delete(wishlistItems)
            .where(
                and(
                    eq(wishlistItems.id, itemId),
                    eq(wishlistItems.user_id, userId),
                ),
            )
            .run();
    }

    /**
     * Delete multiple items.
     *
     * Note: this operation may partially succeed.
     */
    async batchDeleteItems(
        itemIds: string[],
        userId: string,
    ): Promise<{
        processedCount: number;
        failedCount: number;
        success: boolean;
        errors: string[];
    }> {
        if (itemIds.length === 0) {
            return {
                processedCount: 0,
                failedCount: 0,
                success: false,
                errors: [],
            };
        }

        // Verify ownership - only delete items belonging to the user
        const userItems = await this.db
            .select({ id: wishlistItems.id })
            .from(wishlistItems)
            .where(
                and(
                    inArray(wishlistItems.id, itemIds),
                    eq(wishlistItems.user_id, userId),
                ),
            )
            .all();

        const validItemIds = userItems.map((item) => item.id);
        const invalidCount = itemIds.length - validItemIds.length;

        if (validItemIds.length === 0) {
            return {
                processedCount: 0,
                failedCount: itemIds.length,
                success: false,
                errors: ["No valid items to delete"],
            };
        }

        // Delete items (links cascade delete via foreign key)
        await this.db
            .delete(wishlistItems)
            .where(inArray(wishlistItems.id, validItemIds))
            .run();

        return {
            processedCount: validItemIds.length,
            failedCount: invalidCount,
            success: validItemIds.length > 0,
            errors:
                invalidCount > 0
                    ? [
                          `${invalidCount} ${
                              invalidCount === 1 ? "item" : "items"
                          } not found or unauthorized`,
                      ]
                    : [],
        };
    }

    /**
     * Move multiple items to a category.
     *
     * Note: this operation may partially succeed.
     */
    async batchMoveItems(
        itemIds: string[],
        userId: string,
        categoryId: string | null,
    ): Promise<{
        processedCount: number;
        failedCount: number;
        success: boolean;
        errors: string[];
    }> {
        if (itemIds.length === 0) {
            return {
                processedCount: 0,
                failedCount: 0,
                success: false,
                errors: [],
            };
        }

        // Verify ownership of items
        const userItems = await this.db
            .select({ id: wishlistItems.id })
            .from(wishlistItems)
            .where(
                and(
                    inArray(wishlistItems.id, itemIds),
                    eq(wishlistItems.user_id, userId),
                ),
            )
            .all();

        const validItemIds = userItems.map((item) => item.id);
        const invalidCount = itemIds.length - validItemIds.length;

        if (validItemIds.length === 0) {
            return {
                processedCount: 0,
                failedCount: itemIds.length,
                success: false,
                errors: ["No valid items to move"],
            };
        }

        // If moving to a category, verify it exists and belongs to user
        if (categoryId) {
            const category = await this.db
                .select()
                .from(wishlistCategories)
                .where(
                    and(
                        eq(wishlistCategories.id, categoryId),
                        eq(wishlistCategories.user_id, userId),
                    ),
                )
                .get();

            if (!category) {
                return {
                    processedCount: 0,
                    failedCount: itemIds.length,
                    success: false,
                    errors: ["Category not found or unauthorized"],
                };
            }
        }

        // Update items
        await this.db
            .update(wishlistItems)
            .set({
                category_id: categoryId,
                updated_at: new Date().toISOString(),
            })
            .where(inArray(wishlistItems.id, validItemIds))
            .run();

        return {
            processedCount: validItemIds.length,
            failedCount: invalidCount,
            success: validItemIds.length > 0,
            errors:
                invalidCount > 0
                    ? [
                          `${invalidCount} ${
                              invalidCount === 1 ? "item" : "items"
                          } not found or unauthorized`,
                      ]
                    : [],
        };
    }

    // Item link operations
    async getItemLinks(
        requesterUserId: string,
        itemId: string,
    ): Promise<WishlistItemLink[]> {
        await this.assertItemOwnedByUser(requesterUserId, itemId);
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
        requesterUserId: string,
        linkData: Omit<NewWishlistItemLink, "id" | "created_at" | "updated_at">,
    ): Promise<WishlistItemLink> {
        await this.assertItemOwnedByUser(requesterUserId, linkData.item_id);
        return await this.db
            .insert(wishlistItemLinks)
            .values({ id: crypto.randomUUID(), ...linkData })
            .returning()
            .get();
    }

    async updateItemLink(
        requesterUserId: string,
        linkId: string,
        updates: WishlistItemLinkUpdate,
    ): Promise<WishlistItemLink | null> {
        const row = await this.db
            .update(wishlistItemLinks)
            .set({ ...updates, updated_at: new Date().toISOString() })
            .where(
                and(
                    eq(wishlistItemLinks.id, linkId),
                    sql`exists(select 1 from ${wishlistItems} where ${wishlistItems.id} = ${wishlistItemLinks.item_id} and ${wishlistItems.user_id} = ${requesterUserId})`,
                ),
            )
            .returning()
            .get();
        return row || null;
    }

    async deleteItemLink(
        requesterUserId: string,
        linkId: string,
    ): Promise<void> {
        const link = await this.db
            .select({ id: wishlistItemLinks.id })
            .from(wishlistItemLinks)
            .where(
                and(
                    eq(wishlistItemLinks.id, linkId),
                    sql`exists(select 1 from ${wishlistItems} where ${wishlistItems.id} = ${wishlistItemLinks.item_id} and ${wishlistItems.user_id} = ${requesterUserId})`,
                ),
            )
            .get();

        if (!link) {
            throw new WishlistAuthorizationError();
        }

        await this.db
            .delete(wishlistItemLinks)
            .where(eq(wishlistItemLinks.id, linkId))
            .run();
    }

    async setPrimaryLink(
        requesterUserId: string,
        itemId: string,
        linkId: string,
    ): Promise<void> {
        await this.assertItemOwnedByUser(requesterUserId, itemId);

        const link = await this.db
            .select({ id: wishlistItemLinks.id })
            .from(wishlistItemLinks)
            .where(
                and(
                    eq(wishlistItemLinks.id, linkId),
                    eq(wishlistItemLinks.item_id, itemId),
                ),
            )
            .get();

        if (!link) {
            throw new WishlistAuthorizationError();
        }

        // Single atomic UPDATE using CASE statement to prevent race conditions
        const now = new Date().toISOString();

        await this.db
            .update(wishlistItemLinks)
            .set({
                is_primary: sql`CASE WHEN ${wishlistItemLinks.id} = ${linkId} THEN 1 ELSE 0 END`,
                updated_at: now,
            })
            .where(eq(wishlistItemLinks.item_id, itemId))
            .run();
    }

    // Combined operations
    async getUserWishlistData(userId: string, options: ItemQueryOptions = {}) {
        const {
            limit,
            offset = 0,
            categoryId,
            search,
            status,
            sortBy,
            sortDir,
        } = options;

        const [categories, items, totalItems] = await Promise.all([
            this.getUserCategories(userId),
            this.getUserItems(userId, {
                limit,
                offset,
                categoryId,
                search,
                status,
                sortBy,
                sortDir,
            }),
            this.getUserItemsCount(userId, { categoryId, search, status }),
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
