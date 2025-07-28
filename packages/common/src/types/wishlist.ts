export interface WishlistCategory {
  id: string;
  name: string;
  color?: string;
  createdAt: Date;
  userId?: string; // Added for multi-user support
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
  userId?: string; // Added for multi-user support
}

export interface WishlistData {
  categories: WishlistCategory[];
  items: WishlistItem[];
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
