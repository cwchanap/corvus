import { GraphQLError } from "graphql";
import type { Resolvers } from "./types";
import { AuthServiceError, SupabaseAuthService } from "../lib/auth/service";
import {
    WishlistService,
    WishlistAuthorizationError,
} from "../lib/wishlist/service";
import { mapUser, mapCategory, mapItem, mapLink } from "./mappers";

/**
 * GraphQL resolvers
 * Maps GraphQL operations to service layer methods
 */
export const resolvers: Resolvers = {
    Query: {
        me: async (_parent, _args, context) => {
            return context.user ? mapUser(context.user) : null;
        },
        wishlist: async (_parent, args, context) => {
            if (!context.user) {
                throw new GraphQLError("Not authenticated", {
                    extensions: { code: "UNAUTHENTICATED" },
                });
            }

            const wishlistService = new WishlistService(context.db);

            // Parse pagination
            const rawPage = args.pagination?.page ?? 1;
            const page = Math.max(1, Math.trunc(rawPage));

            const rawPageSize = args.pagination?.pageSize ?? 10;
            const pageSize = Math.min(Math.max(Math.trunc(rawPageSize), 1), 50);
            const offset = (page - 1) * pageSize;

            // Parse filters
            const categoryId = args.filter?.categoryId ?? undefined;
            const search = args.filter?.search ?? undefined;
            const status = args.filter?.status
                ? args.filter.status === "ALL"
                    ? "ALL"
                    : args.filter.status.toLowerCase()
                : undefined;
            const sortBy = args.filter?.sortBy ?? undefined;
            const sortDir = args.filter?.sortDir ?? undefined;

            const data = await wishlistService.getUserWishlistData(
                context.user.id,
                {
                    limit: pageSize,
                    offset,
                    categoryId,
                    search,
                    status,
                    sortBy,
                    sortDir,
                },
            );

            return {
                categories: data.categories.map(mapCategory),
                items: data.items.map((item) => mapItem(item, item.links)),
                pagination: {
                    totalItems: data.pagination.total_items,
                    page: data.pagination.page,
                    pageSize: data.pagination.page_size,
                    totalPages: data.pagination.total_pages,
                    hasNext: data.pagination.has_next,
                    hasPrevious: data.pagination.has_previous,
                },
            };
        },
        categories: async (_parent, _args, context) => {
            if (!context.user) {
                throw new GraphQLError("Not authenticated", {
                    extensions: { code: "UNAUTHENTICATED" },
                });
            }

            const wishlistService = new WishlistService(context.db);
            const categories = await wishlistService.getUserCategories(
                context.user.id,
            );
            return categories.map(mapCategory);
        },
        item: async (_parent, args, context) => {
            if (!context.user) {
                throw new GraphQLError("Not authenticated", {
                    extensions: { code: "UNAUTHENTICATED" },
                });
            }

            const wishlistService = new WishlistService(context.db);
            const item = await wishlistService.getItemById(
                context.user.id,
                args.id,
            );

            if (!item) {
                return null;
            }

            // Load links for the item
            try {
                const links = await wishlistService.getItemLinks(
                    context.user.id,
                    item.id,
                );
                return mapItem(item, links);
            } catch (error) {
                if (error instanceof WishlistAuthorizationError) {
                    throw new GraphQLError(error.message, {
                        extensions: { code: "FORBIDDEN" },
                    });
                }
                throw error;
            }
        },
        checkDuplicateUrl: async (_parent, args, context) => {
            if (!context.user) {
                throw new GraphQLError("Not authenticated", {
                    extensions: { code: "UNAUTHENTICATED" },
                });
            }

            const wishlistService = new WishlistService(context.db);
            const result = await wishlistService.checkDuplicateUrl(
                context.user.id,
                args.url,
                args.excludeItemId ?? undefined,
            );

            return {
                isDuplicate: result.isDuplicate,
                conflictingItem: result.conflictingItem
                    ? mapItem(result.conflictingItem, [])
                    : null,
            };
        },
        recentItems: async (_parent, args, context) => {
            if (!context.user) {
                throw new GraphQLError("Not authenticated", {
                    extensions: { code: "UNAUTHENTICATED" },
                });
            }

            const wishlistService = new WishlistService(context.db);
            const items = await wishlistService.getRecentItems(
                context.user.id,
                args.limit ?? 5,
            );

            return items.map((item) => mapItem(item, item.links));
        },
    },
    Mutation: {
        register: async (_parent, args, context) => {
            const authService = new SupabaseAuthService(
                context.supabase,
                context.db,
            );

            try {
                const user = await authService.register(
                    args.input.email,
                    args.input.password,
                    args.input.name,
                );

                return {
                    success: true,
                    user: mapUser(user),
                    error: null,
                };
            } catch (error) {
                const registerErrorPayload = toRegisterErrorPayload(error);
                if (registerErrorPayload) {
                    return registerErrorPayload;
                }
                console.error("Registration error:", error);
                throw new GraphQLError("Registration failed", {
                    extensions: { code: "INTERNAL_SERVER_ERROR" },
                });
            }
        },
        login: async (_parent, args, context) => {
            const authService = new SupabaseAuthService(
                context.supabase,
                context.db,
            );

            try {
                const user = await authService.login(
                    args.input.email,
                    args.input.password,
                );

                if (!user) {
                    return {
                        success: false,
                        user: null,
                        error: "Invalid email or password",
                    };
                }

                return {
                    success: true,
                    user: mapUser(user),
                    error: null,
                };
            } catch (error) {
                const loginGraphQLError = toLoginGraphQLError(error);
                if (loginGraphQLError) {
                    throw loginGraphQLError;
                }

                console.error("Login error:", error);
                throw new GraphQLError("Login failed", {
                    extensions: { code: "INTERNAL_SERVER_ERROR" },
                });
            }
        },
        logout: async (_parent, _args, context) => {
            const authService = new SupabaseAuthService(
                context.supabase,
                context.db,
            );
            try {
                await authService.logout();
            } catch (error) {
                console.error("Logout error:", error);
                throw new GraphQLError("Logout failed", {
                    extensions: { code: "INTERNAL_SERVER_ERROR" },
                });
            }
            return true;
        },
        createCategory: async (_parent, args, context) => {
            if (!context.user) {
                throw new GraphQLError("Not authenticated", {
                    extensions: { code: "UNAUTHENTICATED" },
                });
            }

            const wishlistService = new WishlistService(context.db);
            const category = await wishlistService.createCategory({
                user_id: context.user.id,
                name: args.input.name,
                color: args.input.color ?? null,
            });
            return mapCategory(category);
        },
        updateCategory: async (_parent, args, context) => {
            if (!context.user) {
                throw new GraphQLError("Not authenticated", {
                    extensions: { code: "UNAUTHENTICATED" },
                });
            }

            const wishlistService = new WishlistService(context.db);
            const category = await wishlistService.updateCategory(
                args.id,
                context.user.id,
                {
                    name: args.input.name ?? undefined,
                    color: args.input.color ?? undefined,
                },
            );

            return category ? mapCategory(category) : null;
        },
        deleteCategory: async (_parent, args, context) => {
            if (!context.user) {
                throw new GraphQLError("Not authenticated", {
                    extensions: { code: "UNAUTHENTICATED" },
                });
            }

            const wishlistService = new WishlistService(context.db);
            await wishlistService.deleteCategory(args.id, context.user.id);
            return true;
        },
        createItem: async (_parent, args, context) => {
            if (!context.user) {
                throw new GraphQLError("Not authenticated", {
                    extensions: { code: "UNAUTHENTICATED" },
                });
            }

            const wishlistService = new WishlistService(context.db);

            const itemData = {
                user_id: context.user.id,
                category_id: args.input.categoryId,
                title: args.input.title,
                description: args.input.description ?? null,
                favicon: args.input.favicon ?? null,
                status: args.input.status
                    ? (args.input.status.toLowerCase() as
                          | "want"
                          | "purchased"
                          | "archived")
                    : ("want" as const),
                priority: args.input.priority ?? null,
            };

            // If URL is provided, use transactional method to create item and link atomically
            if (args.input.url) {
                try {
                    const { item, link } =
                        await wishlistService.createItemWithPrimaryLink(
                            itemData,
                            {
                                url: args.input.url,
                                description: args.input.linkDescription ?? null,
                                is_primary: true,
                            },
                        );
                    return mapItem(item, [link]);
                } catch (error) {
                    if (error instanceof WishlistAuthorizationError) {
                        throw new GraphQLError(error.message, {
                            extensions: { code: "FORBIDDEN" },
                        });
                    }
                    throw error;
                }
            }

            // If no URL, create item without link
            const item = await wishlistService.createItem(itemData);

            return mapItem(item, []);
        },
        updateItem: async (_parent, args, context) => {
            if (!context.user) {
                throw new GraphQLError("Not authenticated", {
                    extensions: { code: "UNAUTHENTICATED" },
                });
            }

            const wishlistService = new WishlistService(context.db);
            const item = await wishlistService.updateItem(
                args.id,
                context.user.id,
                {
                    title: args.input.title ?? undefined,
                    // Preserve null to allow clearing category; only use undefined if field not provided
                    category_id:
                        "categoryId" in args.input
                            ? args.input.categoryId
                            : undefined,
                    description: args.input.description ?? undefined,
                    favicon: args.input.favicon ?? undefined,
                    status: args.input.status
                        ? (args.input.status.toLowerCase() as
                              | "want"
                              | "purchased"
                              | "archived")
                        : undefined,
                    priority:
                        "priority" in args.input
                            ? (args.input.priority ?? null)
                            : undefined,
                },
            );

            if (!item) {
                throw new GraphQLError("Item not found", {
                    extensions: { code: "NOT_FOUND" },
                });
            }

            // Load links for the item
            try {
                const links = await wishlistService.getItemLinks(
                    context.user.id,
                    item.id,
                );
                return mapItem(item, links);
            } catch (error) {
                if (error instanceof WishlistAuthorizationError) {
                    throw new GraphQLError(error.message, {
                        extensions: { code: "FORBIDDEN" },
                    });
                }
                throw error;
            }
        },
        deleteItem: async (_parent, args, context) => {
            if (!context.user) {
                throw new GraphQLError("Not authenticated", {
                    extensions: { code: "UNAUTHENTICATED" },
                });
            }

            const wishlistService = new WishlistService(context.db);
            await wishlistService.deleteItem(args.id, context.user.id);
            return true;
        },
        addItemLink: async (_parent, args, context) => {
            if (!context.user) {
                throw new GraphQLError("Not authenticated", {
                    extensions: { code: "UNAUTHENTICATED" },
                });
            }

            const wishlistService = new WishlistService(context.db);
            try {
                const link = await wishlistService.createItemLink(
                    context.user.id,
                    {
                        item_id: args.itemId,
                        url: args.input.url,
                        description: args.input.description ?? null,
                        is_primary: args.input.isPrimary ?? false,
                    },
                );
                return mapLink(link);
            } catch (error) {
                if (error instanceof WishlistAuthorizationError) {
                    throw new GraphQLError(error.message, {
                        extensions: { code: "FORBIDDEN" },
                    });
                }
                throw error;
            }
        },
        updateItemLink: async (_parent, args, context) => {
            if (!context.user) {
                throw new GraphQLError("Not authenticated", {
                    extensions: { code: "UNAUTHENTICATED" },
                });
            }

            const wishlistService = new WishlistService(context.db);
            try {
                const link = await wishlistService.updateItemLink(
                    context.user.id,
                    args.id,
                    {
                        url: args.input.url ?? undefined,
                        description: args.input.description ?? undefined,
                        is_primary: args.input.isPrimary ?? undefined,
                    },
                );

                return link ? mapLink(link) : null;
            } catch (error) {
                if (error instanceof WishlistAuthorizationError) {
                    throw new GraphQLError(error.message, {
                        extensions: { code: "FORBIDDEN" },
                    });
                }
                throw error;
            }
        },
        deleteItemLink: async (_parent, args, context) => {
            if (!context.user) {
                throw new GraphQLError("Not authenticated", {
                    extensions: { code: "UNAUTHENTICATED" },
                });
            }

            const wishlistService = new WishlistService(context.db);
            try {
                await wishlistService.deleteItemLink(context.user.id, args.id);
                return true;
            } catch (error) {
                if (error instanceof WishlistAuthorizationError) {
                    throw new GraphQLError(error.message, {
                        extensions: { code: "FORBIDDEN" },
                    });
                }
                throw error;
            }
        },
        setPrimaryLink: async (_parent, args, context) => {
            if (!context.user) {
                throw new GraphQLError("Not authenticated", {
                    extensions: { code: "UNAUTHENTICATED" },
                });
            }

            const wishlistService = new WishlistService(context.db);
            try {
                await wishlistService.setPrimaryLink(
                    context.user.id,
                    args.itemId,
                    args.linkId,
                );
                return true;
            } catch (error) {
                if (error instanceof WishlistAuthorizationError) {
                    throw new GraphQLError(error.message, {
                        extensions: { code: "FORBIDDEN" },
                    });
                }
                throw error;
            }
        },
        batchDeleteItems: async (_parent, args, context) => {
            if (!context.user) {
                throw new GraphQLError("Not authenticated", {
                    extensions: { code: "UNAUTHENTICATED" },
                });
            }

            // Validate batch size
            const MAX_BATCH_SIZE = 100;
            if (args.input.itemIds.length === 0) {
                throw new GraphQLError("At least one item ID required", {
                    extensions: { code: "BAD_USER_INPUT" },
                });
            }
            if (args.input.itemIds.length > MAX_BATCH_SIZE) {
                throw new GraphQLError(
                    `Batch operations limited to ${MAX_BATCH_SIZE} items`,
                    {
                        extensions: { code: "BAD_USER_INPUT" },
                    },
                );
            }

            const wishlistService = new WishlistService(context.db);
            const result = await wishlistService.batchDeleteItems(
                args.input.itemIds,
                context.user.id,
            );

            return {
                success: result.failedCount === 0,
                processedCount: result.processedCount,
                failedCount: result.failedCount,
                errors: result.errors.length > 0 ? result.errors : null,
            };
        },
        batchMoveItems: async (_parent, args, context) => {
            if (!context.user) {
                throw new GraphQLError("Not authenticated", {
                    extensions: { code: "UNAUTHENTICATED" },
                });
            }

            // Validate batch size
            const MAX_BATCH_SIZE = 100;
            if (args.input.itemIds.length === 0) {
                throw new GraphQLError("At least one item ID required", {
                    extensions: { code: "BAD_USER_INPUT" },
                });
            }
            if (args.input.itemIds.length > MAX_BATCH_SIZE) {
                throw new GraphQLError(
                    `Batch operations limited to ${MAX_BATCH_SIZE} items`,
                    {
                        extensions: { code: "BAD_USER_INPUT" },
                    },
                );
            }

            const wishlistService = new WishlistService(context.db);
            const result = await wishlistService.batchMoveItems(
                args.input.itemIds,
                context.user.id,
                args.input.categoryId ?? null,
            );

            return {
                success: result.failedCount === 0,
                processedCount: result.processedCount,
                failedCount: result.failedCount,
                errors: result.errors.length > 0 ? result.errors : null,
            };
        },
    },
    WishlistItem: {
        links: async (parent, _args, context) => {
            if (!context.user) {
                throw new GraphQLError("Not authenticated", {
                    extensions: { code: "UNAUTHENTICATED" },
                });
            }

            // If links are already loaded, return them
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            if ((parent as any).links) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                return (parent as any).links;
            }

            // Otherwise, lazy-load links
            const wishlistService = new WishlistService(context.db);
            try {
                const links = await wishlistService.getItemLinks(
                    context.user.id,
                    parent.id,
                );
                return links.map(mapLink);
            } catch (error) {
                if (error instanceof WishlistAuthorizationError) {
                    throw new GraphQLError(error.message, {
                        extensions: { code: "FORBIDDEN" },
                    });
                }
                throw error;
            }
        },
    },
};

function toRegisterErrorPayload(error: unknown): {
    success: false;
    user: null;
    error: string;
} | null {
    if (!(error instanceof AuthServiceError)) {
        return null;
    }

    if (error.code === "ALREADY_EXISTS") {
        return {
            success: false,
            user: null,
            error: "User already exists",
        };
    }

    if (
        error.code === "UNCONFIRMED_ACCOUNT" ||
        error.code === "REGISTRATION_SETUP_FAILED"
    ) {
        return {
            success: false,
            user: null,
            error: error.message,
        };
    }

    return null;
}

function toLoginGraphQLError(error: unknown): GraphQLError | null {
    if (!(error instanceof AuthServiceError)) {
        return null;
    }

    if (error.code === "RATE_LIMITED") {
        return new GraphQLError(
            "Too many login attempts. Please wait and try again.",
            {
                extensions: {
                    code: "RATE_LIMITED",
                    status: error.status ?? 429,
                },
            },
        );
    }

    if (error.code === "TRANSIENT") {
        return new GraphQLError(
            "Login is temporarily unavailable. Please try again.",
            {
                extensions: {
                    code: "SERVICE_UNAVAILABLE",
                    status: error.status ?? 503,
                },
            },
        );
    }

    if (error.code === "UNCONFIRMED_ACCOUNT") {
        return new GraphQLError(
            "Please confirm your email before logging in.",
            {
                extensions: {
                    code: "BAD_USER_INPUT",
                    status: error.status ?? 400,
                },
            },
        );
    }

    return null;
}
