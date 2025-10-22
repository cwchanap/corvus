/**
 * Adapters to convert between GraphQL types (camelCase) and database record types (snake_case)
 * This allows gradual migration of components from REST to GraphQL
 */

import type {
  GraphQLWishlistCategory,
  GraphQLWishlistItem,
  GraphQLWishlistItemLink,
  GraphQLWishlistPayload,
  GraphQLPaginationInfo,
} from "@repo/common/graphql/types";
import type {
  WishlistCategoryRecord,
  WishlistItemRecord,
  WishlistItemLinkRecord,
  WishlistDataRecord,
  WishlistPaginationRecord,
} from "@repo/common/types/wishlist-record";

export function adaptCategory(
  graphql: GraphQLWishlistCategory,
): WishlistCategoryRecord {
  return {
    id: graphql.id,
    user_id: graphql.userId ? Number(graphql.userId) : undefined,
    name: graphql.name,
    color: graphql.color ?? undefined,
    created_at: graphql.createdAt,
    updated_at: graphql.updatedAt,
  };
}

export function adaptLink(
  graphql: GraphQLWishlistItemLink,
): WishlistItemLinkRecord {
  return {
    id: graphql.id,
    item_id: graphql.itemId,
    url: graphql.url,
    description: graphql.description ?? undefined,
    is_primary: graphql.isPrimary,
    created_at: graphql.createdAt,
    updated_at: graphql.updatedAt,
  };
}

export function adaptItem(graphql: GraphQLWishlistItem): WishlistItemRecord {
  return {
    id: graphql.id,
    user_id: graphql.userId ? Number(graphql.userId) : undefined,
    category_id: graphql.categoryId ?? undefined,
    title: graphql.title,
    description: graphql.description ?? undefined,
    favicon: graphql.favicon ?? undefined,
    created_at: graphql.createdAt,
    updated_at: graphql.updatedAt,
    links: graphql.links?.map(adaptLink),
  };
}

export function adaptPagination(
  graphql: GraphQLPaginationInfo,
): WishlistPaginationRecord {
  return {
    total_items: graphql.totalItems,
    page: graphql.page,
    page_size: graphql.pageSize,
    total_pages: graphql.totalPages,
    has_next: graphql.hasNext,
    has_previous: graphql.hasPrevious,
  };
}

export function adaptWishlistData(
  graphql: GraphQLWishlistPayload,
): WishlistDataRecord {
  return {
    categories: graphql.categories.map(adaptCategory),
    items: graphql.items.map(adaptItem),
    pagination: adaptPagination(graphql.pagination),
  };
}
