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
    userId: string;
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

export type ItemStatus = "WANT" | "PURCHASED" | "ARCHIVED";
export type WishlistFilterStatus = ItemStatus | "ALL";

export interface GraphQLWishlistItem {
    id: string;
    title: string;
    description: string | null;
    categoryId: string | null;
    favicon: string | null;
    status: ItemStatus;
    priority: number | null;
    userId: string;
    createdAt: string;
    updatedAt: string;
    links: GraphQLWishlistItemLink[];
}

export interface GraphQLDuplicateUrlItem {
    id: string;
    title: string;
    categoryId: string | null;
}

export interface GraphQLDuplicateUrlCheckResult {
    isDuplicate: boolean;
    conflictingItem: GraphQLDuplicateUrlItem | null;
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
    status?: WishlistFilterStatus;
    sortBy?: string;
    sortDir?: "ASC" | "DESC";
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
    status?: ItemStatus;
    priority?: number | null;
}

export interface ItemUpdateInput {
    title?: string;
    categoryId?: string | null;
    description?: string;
    favicon?: string;
    status?: ItemStatus;
    priority?: number | null;
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

// Batch operation types
export interface BatchDeleteInput {
    itemIds: string[];
}

export interface BatchMoveInput {
    itemIds: string[];
    categoryId?: string;
}

export interface BatchOperationResult {
    success: boolean;
    processedCount: number;
    failedCount: number;
    errors: string[] | null;
}
