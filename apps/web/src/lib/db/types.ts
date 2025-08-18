import { Generated, Insertable, Selectable, Updateable } from "kysely";

export interface Database {
  users: UserTable;
  sessions: SessionTable;
  wishlist_categories: WishlistCategoryTable;
  wishlist_items: WishlistItemTable;
}

export interface UserTable {
  id: Generated<number>;
  email: string;
  password_hash: string;
  name: string;
  created_at: Generated<string>;
  updated_at: Generated<string>;
}

export interface SessionTable {
  id: string;
  user_id: number;
  expires_at: string;
  created_at: Generated<string>;
}

export type User = Selectable<UserTable>;
export type NewUser = Insertable<UserTable>;
export type UserUpdate = Updateable<UserTable>;
export type PublicUser = Omit<User, "password_hash">;

export type Session = Selectable<SessionTable>;
export type NewSession = Insertable<SessionTable>;
export type SessionUpdate = Updateable<SessionTable>;

export interface WishlistCategoryTable {
  id: Generated<string>;
  user_id: number;
  name: string;
  color?: string;
  created_at: Generated<string>;
  updated_at: Generated<string>;
}

export interface WishlistItemTable {
  id: Generated<string>;
  user_id: number;
  category_id: string;
  title: string;
  url: string;
  description?: string;
  favicon?: string;
  created_at: Generated<string>;
  updated_at: Generated<string>;
}

export type WishlistCategory = Selectable<WishlistCategoryTable>;
export type NewWishlistCategory = Insertable<WishlistCategoryTable>;
export type WishlistCategoryUpdate = Updateable<WishlistCategoryTable>;

export type WishlistItem = Selectable<WishlistItemTable>;
export type NewWishlistItem = Insertable<WishlistItemTable>;
export type WishlistItemUpdate = Updateable<WishlistItemTable>;
