export interface WishlistCategory {
  id: string;
  name: string;
  color?: string;
  createdAt: Date;
  userId?: string; // Added for multi-user support
}

export interface WishlistItemLink {
  id: string;
  itemId: string;
  url: string;
  description?: string;
  isPrimary: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface WishlistItem {
  id: string;
  title: string;
  description?: string;
  categoryId: string;
  favicon?: string;
  createdAt: Date;
  updatedAt: Date;
  userId?: string; // Added for multi-user support
  links?: WishlistItemLink[]; // Links are loaded separately
}

export interface WishlistPagination {
  totalItems: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface WishlistData {
  categories: WishlistCategory[];
  items: WishlistItem[];
  pagination: WishlistPagination;
}

export interface WishlistItemsPage {
  items: WishlistItem[];
  pagination: WishlistPagination;
}

export interface PageInfo {
  title: string;
  url: string;
  favicon?: string;
}

// Auth-related types
export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthSession {
  user: User;
  sessionId: string;
  expiresAt: Date;
}
