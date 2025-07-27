export interface WishlistCategory {
  id: string;
  name: string;
  color?: string;
  createdAt: Date;
}

export interface WishlistItem {
  id: string;
  title: string;
  url: string;
  description?: string;
  categoryId: string;
  favicon?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface WishlistData {
  categories: WishlistCategory[];
  items: WishlistItem[];
}
