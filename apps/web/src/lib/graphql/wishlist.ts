/**
 * GraphQL queries and mutations for wishlist operations
 */

import { graphqlRequest } from "./client.js";

// Types matching GraphQL schema
export interface WishlistCategory {
  id: string;
  name: string;
  color: string | null;
  userId: number;
  createdAt: string;
  updatedAt: string;
}

export interface WishlistItemLink {
  id: string;
  url: string;
  description: string | null;
  itemId: string;
  isPrimary: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WishlistItem {
  id: string;
  title: string;
  description: string | null;
  categoryId: string | null;
  favicon: string | null;
  userId: number;
  createdAt: string;
  updatedAt: string;
  links: WishlistItemLink[];
}

export interface PaginationInfo {
  totalItems: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface WishlistPayload {
  categories: WishlistCategory[];
  items: WishlistItem[];
  pagination: PaginationInfo;
}

// Queries
const WISHLIST_QUERY = `
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

export interface WishlistFilterInput {
  categoryId?: string;
  search?: string;
}

export interface PaginationInput {
  page?: number;
  pageSize?: number;
}

export async function getWishlist(
  filter?: WishlistFilterInput,
  pagination?: PaginationInput,
): Promise<WishlistPayload> {
  const data = await graphqlRequest<{ wishlist: WishlistPayload }>(
    WISHLIST_QUERY,
    { filter, pagination },
  );
  return data.wishlist;
}

const CATEGORIES_QUERY = `
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

export async function getCategories(): Promise<WishlistCategory[]> {
  const data = await graphqlRequest<{ categories: WishlistCategory[] }>(
    CATEGORIES_QUERY,
  );
  return data.categories;
}

const ITEM_QUERY = `
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

export async function getItem(id: string): Promise<WishlistItem | null> {
  const data = await graphqlRequest<{ item: WishlistItem | null }>(ITEM_QUERY, {
    id,
  });
  return data.item;
}

// Mutations
const CREATE_CATEGORY_MUTATION = `
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

export interface CategoryInput {
  name: string;
  color?: string;
}

export async function createCategory(
  input: CategoryInput,
): Promise<WishlistCategory> {
  const data = await graphqlRequest<{ createCategory: WishlistCategory }>(
    CREATE_CATEGORY_MUTATION,
    { input },
  );
  return data.createCategory;
}

const UPDATE_CATEGORY_MUTATION = `
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

export interface CategoryUpdateInput {
  name?: string;
  color?: string;
}

export async function updateCategory(
  id: string,
  input: CategoryUpdateInput,
): Promise<WishlistCategory | null> {
  const data = await graphqlRequest<{
    updateCategory: WishlistCategory | null;
  }>(UPDATE_CATEGORY_MUTATION, { id, input });
  return data.updateCategory;
}

const DELETE_CATEGORY_MUTATION = `
  mutation DeleteCategory($id: ID!) {
    deleteCategory(id: $id)
  }
`;

export async function deleteCategory(id: string): Promise<boolean> {
  const data = await graphqlRequest<{ deleteCategory: boolean }>(
    DELETE_CATEGORY_MUTATION,
    { id },
  );
  return data.deleteCategory;
}

const CREATE_ITEM_MUTATION = `
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

export interface ItemInput {
  title: string;
  categoryId: string;
  description?: string;
  favicon?: string;
  url?: string;
  linkDescription?: string;
}

export async function createItem(input: ItemInput): Promise<WishlistItem> {
  const data = await graphqlRequest<{ createItem: WishlistItem }>(
    CREATE_ITEM_MUTATION,
    { input },
  );
  return data.createItem;
}

const UPDATE_ITEM_MUTATION = `
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

export interface ItemUpdateInput {
  title?: string;
  categoryId?: string;
  description?: string;
  favicon?: string;
}

export async function updateItem(
  id: string,
  input: ItemUpdateInput,
): Promise<WishlistItem | null> {
  const data = await graphqlRequest<{ updateItem: WishlistItem | null }>(
    UPDATE_ITEM_MUTATION,
    { id, input },
  );
  return data.updateItem;
}

const DELETE_ITEM_MUTATION = `
  mutation DeleteItem($id: ID!) {
    deleteItem(id: $id)
  }
`;

export async function deleteItem(id: string): Promise<boolean> {
  const data = await graphqlRequest<{ deleteItem: boolean }>(
    DELETE_ITEM_MUTATION,
    { id },
  );
  return data.deleteItem;
}

const ADD_ITEM_LINK_MUTATION = `
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

export interface ItemLinkInput {
  url: string;
  description?: string;
  isPrimary?: boolean;
}

export async function addItemLink(
  itemId: string,
  input: ItemLinkInput,
): Promise<WishlistItemLink> {
  const data = await graphqlRequest<{ addItemLink: WishlistItemLink }>(
    ADD_ITEM_LINK_MUTATION,
    { itemId, input },
  );
  return data.addItemLink;
}

const UPDATE_ITEM_LINK_MUTATION = `
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

export interface ItemLinkUpdateInput {
  url?: string;
  description?: string;
  isPrimary?: boolean;
}

export async function updateItemLink(
  id: string,
  input: ItemLinkUpdateInput,
): Promise<WishlistItemLink | null> {
  const data = await graphqlRequest<{
    updateItemLink: WishlistItemLink | null;
  }>(UPDATE_ITEM_LINK_MUTATION, { id, input });
  return data.updateItemLink;
}

const DELETE_ITEM_LINK_MUTATION = `
  mutation DeleteItemLink($id: ID!) {
    deleteItemLink(id: $id)
  }
`;

export async function deleteItemLink(id: string): Promise<boolean> {
  const data = await graphqlRequest<{ deleteItemLink: boolean }>(
    DELETE_ITEM_LINK_MUTATION,
    { id },
  );
  return data.deleteItemLink;
}

const SET_PRIMARY_LINK_MUTATION = `
  mutation SetPrimaryLink($itemId: ID!, $linkId: ID!) {
    setPrimaryLink(itemId: $itemId, linkId: $linkId)
  }
`;

export async function setPrimaryLink(
  itemId: string,
  linkId: string,
): Promise<boolean> {
  const data = await graphqlRequest<{ setPrimaryLink: boolean }>(
    SET_PRIMARY_LINK_MUTATION,
    { itemId, linkId },
  );
  return data.setPrimaryLink;
}
