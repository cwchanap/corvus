/**
 * Web app wishlist operations
 * Uses shared query strings and types from @repo/common with app-specific client
 */

import {
    WISHLIST_QUERY,
    CATEGORIES_QUERY,
    ITEM_QUERY,
    CREATE_CATEGORY_MUTATION,
    UPDATE_CATEGORY_MUTATION,
    DELETE_CATEGORY_MUTATION,
    CREATE_ITEM_MUTATION,
    UPDATE_ITEM_MUTATION,
    DELETE_ITEM_MUTATION,
    ADD_ITEM_LINK_MUTATION,
    UPDATE_ITEM_LINK_MUTATION,
    DELETE_ITEM_LINK_MUTATION,
    SET_PRIMARY_LINK_MUTATION,
    BATCH_DELETE_ITEMS_MUTATION,
    BATCH_MOVE_ITEMS_MUTATION,
} from "@repo/common/graphql/operations/wishlist";
import { graphqlRequest } from "./client";

// Re-export shared types
export type {
    GraphQLWishlistCategory as WishlistCategory,
    GraphQLWishlistItem as WishlistItem,
    GraphQLWishlistItemLink as WishlistItemLink,
    GraphQLPaginationInfo as PaginationInfo,
    GraphQLWishlistPayload as WishlistPayload,
    WishlistFilterInput,
    PaginationInput,
    CategoryInput,
    CategoryUpdateInput,
    ItemInput,
    ItemUpdateInput,
    ItemLinkInput,
    ItemLinkUpdateInput,
} from "@repo/common/graphql/types";

// Query operations
export async function getWishlist(
    filter?: import("@repo/common/graphql/types").WishlistFilterInput,
    pagination?: import("@repo/common/graphql/types").PaginationInput,
) {
    const data = await graphqlRequest<{
        wishlist: import("@repo/common/graphql/types").GraphQLWishlistPayload;
    }>(WISHLIST_QUERY, { filter, pagination });
    return data.wishlist;
}

export async function getCategories() {
    const data = await graphqlRequest<{
        categories: import("@repo/common/graphql/types").GraphQLWishlistCategory[];
    }>(CATEGORIES_QUERY);
    return data.categories;
}

export async function getItem(id: string) {
    const data = await graphqlRequest<{
        item: import("@repo/common/graphql/types").GraphQLWishlistItem | null;
    }>(ITEM_QUERY, { id });
    return data.item;
}

// Category mutations
export async function createCategory(
    input: import("@repo/common/graphql/types").CategoryInput,
) {
    const data = await graphqlRequest<{
        createCategory: import("@repo/common/graphql/types").GraphQLWishlistCategory;
    }>(CREATE_CATEGORY_MUTATION, { input });
    return data.createCategory;
}

export async function updateCategory(
    id: string,
    input: import("@repo/common/graphql/types").CategoryUpdateInput,
) {
    const data = await graphqlRequest<{
        updateCategory:
            | import("@repo/common/graphql/types").GraphQLWishlistCategory
            | null;
    }>(UPDATE_CATEGORY_MUTATION, { id, input });
    return data.updateCategory;
}

export async function deleteCategory(id: string) {
    const data = await graphqlRequest<{ deleteCategory: boolean }>(
        DELETE_CATEGORY_MUTATION,
        { id },
    );
    return data.deleteCategory;
}

// Item mutations
export async function createItem(
    input: import("@repo/common/graphql/types").ItemInput,
) {
    const data = await graphqlRequest<{
        createItem: import("@repo/common/graphql/types").GraphQLWishlistItem;
    }>(CREATE_ITEM_MUTATION, { input });
    return data.createItem;
}

export async function updateItem(
    id: string,
    input: import("@repo/common/graphql/types").ItemUpdateInput,
) {
    const data = await graphqlRequest<{
        updateItem:
            | import("@repo/common/graphql/types").GraphQLWishlistItem
            | null;
    }>(UPDATE_ITEM_MUTATION, { id, input });
    return data.updateItem;
}

export async function deleteItem(id: string) {
    const data = await graphqlRequest<{ deleteItem: boolean }>(
        DELETE_ITEM_MUTATION,
        {
            id,
        },
    );
    return data.deleteItem;
}

// Link mutations
export async function addItemLink(
    itemId: string,
    input: import("@repo/common/graphql/types").ItemLinkInput,
) {
    const data = await graphqlRequest<{
        addItemLink: import("@repo/common/graphql/types").GraphQLWishlistItemLink;
    }>(ADD_ITEM_LINK_MUTATION, { itemId, input });
    return data.addItemLink;
}

export async function updateItemLink(
    id: string,
    input: import("@repo/common/graphql/types").ItemLinkUpdateInput,
) {
    const data = await graphqlRequest<{
        updateItemLink:
            | import("@repo/common/graphql/types").GraphQLWishlistItemLink
            | null;
    }>(UPDATE_ITEM_LINK_MUTATION, { id, input });
    return data.updateItemLink;
}

export async function deleteItemLink(id: string) {
    const data = await graphqlRequest<{ deleteItemLink: boolean }>(
        DELETE_ITEM_LINK_MUTATION,
        { id },
    );
    return data.deleteItemLink;
}

export async function setPrimaryLink(itemId: string, linkId: string) {
    const data = await graphqlRequest<{ setPrimaryLink: boolean }>(
        SET_PRIMARY_LINK_MUTATION,
        { itemId, linkId },
    );
    return data.setPrimaryLink;
}

// Batch operation types
export interface BatchOperationResult {
    success: boolean;
    processedCount: number;
    failedCount: number;
    errors: string[] | null;
}

export async function batchDeleteItems(
    itemIds: string[],
): Promise<BatchOperationResult> {
    const data = await graphqlRequest<{
        batchDeleteItems: BatchOperationResult;
    }>(BATCH_DELETE_ITEMS_MUTATION, { input: { itemIds } });
    return data.batchDeleteItems;
}

export async function batchMoveItems(
    itemIds: string[],
    categoryId: string | null,
): Promise<BatchOperationResult> {
    const data = await graphqlRequest<{
        batchMoveItems: BatchOperationResult;
    }>(BATCH_MOVE_ITEMS_MUTATION, { input: { itemIds, categoryId } });
    return data.batchMoveItems;
}
