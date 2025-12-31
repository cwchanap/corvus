/**
 * Shared GraphQL wishlist operations
 * Can be used in both web app and extension
 */

import { graphqlRequest, type GraphQLClientOptions } from "../client";
import type {
    GraphQLWishlistPayload,
    GraphQLWishlistCategory,
    GraphQLWishlistItem,
    GraphQLWishlistItemLink,
    WishlistFilterInput,
    PaginationInput,
    CategoryInput,
    CategoryUpdateInput,
    ItemInput,
    ItemUpdateInput,
    ItemLinkInput,
    ItemLinkUpdateInput,
} from "../types";

// Query strings
export const WISHLIST_QUERY = `
  query Wishlist($filter: WishlistFilterInput, $pagination: PaginationInput) {
    wishlist(filter: $filter, pagination: $pagination) {
      categories {
        id
        name
        color
        userId
        createdAt
        updatedAt
      }
      items {
        id
        title
        description
        categoryId
        favicon
        userId
        createdAt
        updatedAt
        links {
          id
          url
          description
          itemId
          isPrimary
          createdAt
          updatedAt
        }
      }
      pagination {
        totalItems
        page
        pageSize
        totalPages
        hasNext
        hasPrevious
      }
    }
  }
`;

export const CATEGORIES_QUERY = `
  query Categories {
    categories {
      id
      name
      color
      userId
      createdAt
      updatedAt
    }
  }
`;

export const ITEM_QUERY = `
  query Item($id: ID!) {
    item(id: $id) {
      id
      title
      description
      categoryId
      favicon
      userId
      createdAt
      updatedAt
      links {
        id
        url
        description
        itemId
        isPrimary
        createdAt
        updatedAt
      }
    }
  }
`;

// Mutation strings
export const CREATE_CATEGORY_MUTATION = `
  mutation CreateCategory($input: CategoryInput!) {
    createCategory(input: $input) {
      id
      name
      color
      userId
      createdAt
      updatedAt
    }
  }
`;

export const UPDATE_CATEGORY_MUTATION = `
  mutation UpdateCategory($id: ID!, $input: CategoryUpdateInput!) {
    updateCategory(id: $id, input: $input) {
      id
      name
      color
      userId
      createdAt
      updatedAt
    }
  }
`;

export const DELETE_CATEGORY_MUTATION = `
  mutation DeleteCategory($id: ID!) {
    deleteCategory(id: $id)
  }
`;

export const CREATE_ITEM_MUTATION = `
  mutation CreateItem($input: ItemInput!) {
    createItem(input: $input) {
      id
      title
      description
      categoryId
      favicon
      userId
      createdAt
      updatedAt
      links {
        id
        url
        description
        itemId
        isPrimary
        createdAt
        updatedAt
      }
    }
  }
`;

export const UPDATE_ITEM_MUTATION = `
  mutation UpdateItem($id: ID!, $input: ItemUpdateInput!) {
    updateItem(id: $id, input: $input) {
      id
      title
      description
      categoryId
      favicon
      userId
      createdAt
      updatedAt
      links {
        id
        url
        description
        itemId
        isPrimary
        createdAt
        updatedAt
      }
    }
  }
`;

export const DELETE_ITEM_MUTATION = `
  mutation DeleteItem($id: ID!) {
    deleteItem(id: $id)
  }
`;

export const ADD_ITEM_LINK_MUTATION = `
  mutation AddItemLink($itemId: ID!, $input: ItemLinkInput!) {
    addItemLink(itemId: $itemId, input: $input) {
      id
      url
      description
      itemId
      isPrimary
      createdAt
      updatedAt
    }
  }
`;

export const UPDATE_ITEM_LINK_MUTATION = `
  mutation UpdateItemLink($id: ID!, $input: ItemLinkUpdateInput!) {
    updateItemLink(id: $id, input: $input) {
      id
      url
      description
      itemId
      isPrimary
      createdAt
      updatedAt
    }
  }
`;

export const DELETE_ITEM_LINK_MUTATION = `
  mutation DeleteItemLink($id: ID!) {
    deleteItemLink(id: $id)
  }
`;

export const SET_PRIMARY_LINK_MUTATION = `
  mutation SetPrimaryLink($itemId: ID!, $linkId: ID!) {
    setPrimaryLink(itemId: $itemId, linkId: $linkId)
  }
`;

export const BATCH_DELETE_ITEMS_MUTATION = `
  mutation BatchDeleteItems($input: BatchDeleteInput!) {
    batchDeleteItems(input: $input) {
      success
      processedCount
      failedCount
      errors
    }
  }
`;

export const BATCH_MOVE_ITEMS_MUTATION = `
  mutation BatchMoveItems($input: BatchMoveInput!) {
    batchMoveItems(input: $input) {
      success
      processedCount
      failedCount
      errors
    }
  }
`;

// Query operations
export async function getWishlist(
    filter?: WishlistFilterInput,
    pagination?: PaginationInput,
    options?: Partial<GraphQLClientOptions>,
): Promise<GraphQLWishlistPayload> {
    const data = await graphqlRequest<{ wishlist: GraphQLWishlistPayload }>(
        WISHLIST_QUERY,
        { filter, pagination },
        options,
    );
    return data.wishlist;
}

export async function getCategories(
    options?: Partial<GraphQLClientOptions>,
): Promise<GraphQLWishlistCategory[]> {
    const data = await graphqlRequest<{
        categories: GraphQLWishlistCategory[];
    }>(CATEGORIES_QUERY, undefined, options);
    return data.categories;
}

export async function getItem(
    id: string,
    options?: Partial<GraphQLClientOptions>,
): Promise<GraphQLWishlistItem | null> {
    const data = await graphqlRequest<{ item: GraphQLWishlistItem | null }>(
        ITEM_QUERY,
        { id },
        options,
    );
    return data.item;
}

// Category mutations
export async function createCategory(
    input: CategoryInput,
    options?: Partial<GraphQLClientOptions>,
): Promise<GraphQLWishlistCategory> {
    const data = await graphqlRequest<{
        createCategory: GraphQLWishlistCategory;
    }>(CREATE_CATEGORY_MUTATION, { input }, options);
    return data.createCategory;
}

export async function updateCategory(
    id: string,
    input: CategoryUpdateInput,
    options?: Partial<GraphQLClientOptions>,
): Promise<GraphQLWishlistCategory | null> {
    const data = await graphqlRequest<{
        updateCategory: GraphQLWishlistCategory | null;
    }>(UPDATE_CATEGORY_MUTATION, { id, input }, options);
    return data.updateCategory;
}

export async function deleteCategory(
    id: string,
    options?: Partial<GraphQLClientOptions>,
): Promise<boolean> {
    const data = await graphqlRequest<{ deleteCategory: boolean }>(
        DELETE_CATEGORY_MUTATION,
        { id },
        options,
    );
    return data.deleteCategory;
}

// Item mutations
export async function createItem(
    input: ItemInput,
    options?: Partial<GraphQLClientOptions>,
): Promise<GraphQLWishlistItem> {
    const data = await graphqlRequest<{ createItem: GraphQLWishlistItem }>(
        CREATE_ITEM_MUTATION,
        { input },
        options,
    );
    return data.createItem;
}

export async function updateItem(
    id: string,
    input: ItemUpdateInput,
    options?: Partial<GraphQLClientOptions>,
): Promise<GraphQLWishlistItem | null> {
    const data = await graphqlRequest<{
        updateItem: GraphQLWishlistItem | null;
    }>(UPDATE_ITEM_MUTATION, { id, input }, options);
    return data.updateItem;
}

export async function deleteItem(
    id: string,
    options?: Partial<GraphQLClientOptions>,
): Promise<boolean> {
    const data = await graphqlRequest<{ deleteItem: boolean }>(
        DELETE_ITEM_MUTATION,
        { id },
        options,
    );
    return data.deleteItem;
}

// Link mutations
export async function addItemLink(
    itemId: string,
    input: ItemLinkInput,
    options?: Partial<GraphQLClientOptions>,
): Promise<GraphQLWishlistItemLink> {
    const data = await graphqlRequest<{ addItemLink: GraphQLWishlistItemLink }>(
        ADD_ITEM_LINK_MUTATION,
        { itemId, input },
        options,
    );
    return data.addItemLink;
}

export async function updateItemLink(
    id: string,
    input: ItemLinkUpdateInput,
    options?: Partial<GraphQLClientOptions>,
): Promise<GraphQLWishlistItemLink | null> {
    const data = await graphqlRequest<{
        updateItemLink: GraphQLWishlistItemLink | null;
    }>(UPDATE_ITEM_LINK_MUTATION, { id, input }, options);
    return data.updateItemLink;
}

export async function deleteItemLink(
    id: string,
    options?: Partial<GraphQLClientOptions>,
): Promise<boolean> {
    const data = await graphqlRequest<{ deleteItemLink: boolean }>(
        DELETE_ITEM_LINK_MUTATION,
        { id },
        options,
    );
    return data.deleteItemLink;
}

export async function setPrimaryLink(
    itemId: string,
    linkId: string,
    options?: Partial<GraphQLClientOptions>,
): Promise<boolean> {
    const data = await graphqlRequest<{ setPrimaryLink: boolean }>(
        SET_PRIMARY_LINK_MUTATION,
        { itemId, linkId },
        options,
    );
    return data.setPrimaryLink;
}
