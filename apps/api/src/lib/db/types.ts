import {
  users,
  sessions,
  wishlistCategories,
  wishlistItems,
  wishlistItemLinks,
} from "./schema.js";

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type UserUpdate = Partial<
  Omit<typeof users.$inferInsert, "id" | "created_at" | "updated_at">
>;
export type PublicUser = Omit<User, "password_hash">;

export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
export type SessionUpdate = Partial<
  Omit<typeof sessions.$inferInsert, "id" | "created_at">
>;

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
