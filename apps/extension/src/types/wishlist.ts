// Re-export GraphQL types with legacy names for component compatibility
export type {
  GraphQLWishlistCategory as WishlistCategory,
  GraphQLWishlistItem as WishlistItem,
  GraphQLWishlistPayload as WishlistData,
  GraphQLPaginationInfo as PageInfo,
} from "@repo/common/graphql/types";
