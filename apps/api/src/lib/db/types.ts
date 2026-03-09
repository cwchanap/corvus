import { wishlistCategories, wishlistItems, wishlistItemLinks } from "./schema";

export interface PublicUser {
    id: string;
    email: string;
    name: string;
    created_at: string;
    updated_at: string;
}

export type WishlistCategory = typeof wishlistCategories.$inferSelect;
export type NewWishlistCategory = typeof wishlistCategories.$inferInsert;
export type WishlistCategoryUpdate = Partial<
    Omit<
        typeof wishlistCategories.$inferInsert,
        "id" | "user_id" | "created_at" | "updated_at"
    >
>;

export type WishlistItem = typeof wishlistItems.$inferSelect;
export type NewWishlistItem = typeof wishlistItems.$inferInsert;
export type WishlistItemUpdate = Partial<
    Omit<
        typeof wishlistItems.$inferInsert,
        "id" | "user_id" | "created_at" | "updated_at"
    >
>;

export type WishlistItemLink = typeof wishlistItemLinks.$inferSelect;
export type NewWishlistItemLink = typeof wishlistItemLinks.$inferInsert;
export type WishlistItemLinkUpdate = Partial<
    Omit<
        typeof wishlistItemLinks.$inferInsert,
        "id" | "created_at" | "updated_at"
    >
>;
