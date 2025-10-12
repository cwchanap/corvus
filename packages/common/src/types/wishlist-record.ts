export interface WishlistCategoryRecord {
  id: string;
  user_id?: number;
  name: string;
  color?: string;
  created_at: string;
  updated_at: string;
}

export interface WishlistItemLinkRecord {
  id: string;
  item_id: string;
  url: string;
  description?: string;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
}

export interface WishlistItemRecord {
  id: string;
  user_id?: number;
  category_id: string;
  title: string;
  description?: string;
  favicon?: string;
  created_at: string;
  updated_at: string;
  links?: WishlistItemLinkRecord[];
}

export interface WishlistDataRecord {
  categories: WishlistCategoryRecord[];
  items: WishlistItemRecord[];
  pagination: WishlistPaginationRecord;
}

export interface WishlistPaginationRecord {
  total_items: number;
  page: number;
  page_size: number;
  total_pages: number;
  has_next: boolean;
  has_previous: boolean;
}

export interface WishlistItemsPageRecord {
  items: WishlistItemRecord[];
  pagination: WishlistPaginationRecord;
}
