/**
 * Mappers to convert between DB types (snake_case) and GraphQL types (camelCase)
 */

import type {
    PublicUser as DBPublicUser,
    WishlistCategory as DBCategory,
    WishlistItem as DBItem,
    WishlistItemLink as DBLink,
} from "../lib/db/types.ts";
import type {
    User,
    WishlistCategory,
    WishlistItem,
    WishlistItemLink,
} from "./types.ts";

export function mapUser(dbUser: DBPublicUser): User {
    return {
        id: String(dbUser.id),
        name: dbUser.name,
        email: dbUser.email,
        createdAt: dbUser.created_at,
        updatedAt: dbUser.updated_at,
    };
}

export function mapCategory(dbCategory: DBCategory): WishlistCategory {
    return {
        id: dbCategory.id,
        name: dbCategory.name,
        color: dbCategory.color,
        createdAt: dbCategory.created_at,
        updatedAt: dbCategory.updated_at,
        userId: dbCategory.user_id,
    };
}

export function mapItem(dbItem: DBItem, links?: DBLink[]): WishlistItem {
    return {
        id: dbItem.id,
        title: dbItem.title,
        description: dbItem.description,
        categoryId: dbItem.category_id,
        favicon: dbItem.favicon,
        createdAt: dbItem.created_at,
        updatedAt: dbItem.updated_at,
        userId: dbItem.user_id,
        links: links ? links.map(mapLink) : [],
    };
}

export function mapLink(dbLink: DBLink): WishlistItemLink {
    return {
        id: dbLink.id,
        url: dbLink.url,
        description: dbLink.description,
        itemId: dbLink.item_id,
        isPrimary: dbLink.is_primary,
        createdAt: dbLink.created_at,
        updatedAt: dbLink.updated_at,
    };
}
