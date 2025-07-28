import type { Generated, Insertable, Selectable, Updateable } from "kysely";

// Database schema types
export interface Database {
  users: UsersTable;
  sessions: SessionsTable;
  wishlist_categories: WishlistCategoriesTable;
  wishlist_items: WishlistItemsTable;
}

export interface UsersTable {
  id: Generated<string>;
  name: string;
  email: string;
  email_verified: boolean;
  image?: string;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export interface SessionsTable {
  id: Generated<string>;
  user_id: string;
  expires_at: Date;
  token: string;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export interface WishlistCategoriesTable {
  id: Generated<string>;
  user_id: string;
  name: string;
  color?: string;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export interface WishlistItemsTable {
  id: Generated<string>;
  user_id: string;
  category_id: string;
  title: string;
  url: string;
  description?: string;
  favicon?: string;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

// Type helpers
export type User = Selectable<UsersTable>;
export type NewUser = Insertable<UsersTable>;
export type UserUpdate = Updateable<UsersTable>;

export type Session = Selectable<SessionsTable>;
export type NewSession = Insertable<SessionsTable>;

export type WishlistCategory = Selectable<WishlistCategoriesTable>;
export type NewWishlistCategory = Insertable<WishlistCategoriesTable>;
export type WishlistCategoryUpdate = Updateable<WishlistCategoriesTable>;

export type WishlistItem = Selectable<WishlistItemsTable>;
export type NewWishlistItem = Insertable<WishlistItemsTable>;
export type WishlistItemUpdate = Updateable<WishlistItemsTable>;
