/**
 * Shared GraphQL types
 * These match the GraphQL schema and use string dates (as returned by GraphQL)
 */

// Auth types
export interface GraphQLUser {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthPayload {
  success: boolean;
  user: GraphQLUser | null;
  error: string | null;
}

// Wishlist types (matching GraphQL schema)
export interface GraphQLWishlistCategory {
  id: string;
  name: string;
  color: string | null;
  userId: number;
  createdAt: string;
  updatedAt: string;
}

export interface GraphQLWishlistItemLink {
  id: string;
  url: string;
  description: string | null;
  itemId: string;
  isPrimary: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GraphQLWishlistItem {
  id: string;
  title: string;
  description: string | null;
  categoryId: string | null;
  favicon: string | null;
  userId: number;
  createdAt: string;
  updatedAt: string;
  links: GraphQLWishlistItemLink[];
}

export interface GraphQLPaginationInfo {
  totalItems: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface GraphQLWishlistPayload {
  categories: GraphQLWishlistCategory[];
  items: GraphQLWishlistItem[];
  pagination: GraphQLPaginationInfo;
}

// Input types
export interface RegisterInput {
  email: string;
  password: string;
  name: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface WishlistFilterInput {
  categoryId?: string;
  search?: string;
  sortBy?: string;
}

export interface PaginationInput {
  page?: number;
  pageSize?: number;
}

export interface CategoryInput {
  name: string;
  color?: string;
}

export interface CategoryUpdateInput {
  name?: string;
  color?: string;
}

export interface ItemInput {
  title: string;
  categoryId?: string;
  description?: string;
  favicon?: string;
  url?: string;
  linkDescription?: string;
}

export interface ItemUpdateInput {
  title?: string;
  categoryId?: string | null;
  description?: string;
  favicon?: string;
}

export interface ItemLinkInput {
  url: string;
  description?: string;
  isPrimary?: boolean;
}

export interface ItemLinkUpdateInput {
  url?: string;
  description?: string;
  isPrimary?: boolean;
}
