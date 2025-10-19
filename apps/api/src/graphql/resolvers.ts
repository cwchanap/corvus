import { GraphQLError } from "graphql";
import type { Resolvers } from "./types.js";
import { AuthService } from "../lib/auth/service.js";
import { WishlistService } from "../lib/wishlist/service.js";
import { setSessionCookie, clearSessionCookie } from "../lib/auth/session.js";
import { mapUser, mapCategory, mapItem, mapLink } from "./mappers.js";

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
      const page = args.pagination?.page ?? 1;
      const pageSize = Math.min(args.pagination?.pageSize ?? 10, 50);
      const offset = (page - 1) * pageSize;

      // Parse filters
      const categoryId = args.filter?.categoryId ?? undefined;
      const search = args.filter?.search ?? undefined;

      const data = await wishlistService.getUserWishlistData(context.user.id, {
        limit: pageSize,
        offset,
        categoryId,
        search,
      });

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
      const items = await wishlistService.getUserItems(context.user.id);
      const item = items.find((i) => i.id === args.id);

      if (!item) {
        return null;
      }

      // Load links for the item
      const links = await wishlistService.getItemLinks(item.id);
      return mapItem(item, links);
    },
  },
  Mutation: {
    register: async (_parent, args, context) => {
      const authService = new AuthService(context.db);

      try {
        const user = await authService.register(
          args.input.email,
          args.input.password,
          args.input.name,
        );

        // Create session and set cookie
        const sessionId = await authService.createSession(user.id);
        setSessionCookie(context.honoContext, sessionId);

        return {
          success: true,
          user: mapUser(user),
          error: null,
        };
      } catch (error) {
        if (error instanceof Error && error.message === "User already exists") {
          return {
            success: false,
            user: null,
            error: "User already exists",
          };
        }
        throw new GraphQLError("Registration failed", {
          extensions: { code: "INTERNAL_SERVER_ERROR" },
        });
      }
    },
    login: async (_parent, args, context) => {
      const authService = new AuthService(context.db);

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

      // Create session and set cookie
      const sessionId = await authService.createSession(user.id);
      setSessionCookie(context.honoContext, sessionId);

      return {
        success: true,
        user: mapUser(user),
        error: null,
      };
    },
    logout: async (_parent, _args, context) => {
      // Clear session cookie
      clearSessionCookie(context.honoContext);
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
      const item = await wishlistService.createItem({
        user_id: context.user.id,
        category_id: args.input.categoryId,
        title: args.input.title,
        description: args.input.description ?? null,
        favicon: args.input.favicon ?? null,
      });

      // If URL is provided, create a primary link
      if (args.input.url) {
        const link = await wishlistService.createItemLink({
          item_id: item.id,
          url: args.input.url,
          description: args.input.linkDescription ?? null,
          is_primary: true,
        });
        return mapItem(item, [link]);
      }

      return mapItem(item, []);
    },
    updateItem: async (_parent, args, context) => {
      if (!context.user) {
        throw new GraphQLError("Not authenticated", {
          extensions: { code: "UNAUTHENTICATED" },
        });
      }

      const wishlistService = new WishlistService(context.db);
      const item = await wishlistService.updateItem(args.id, context.user.id, {
        title: args.input.title ?? undefined,
        category_id: args.input.categoryId ?? undefined,
        description: args.input.description ?? undefined,
        favicon: args.input.favicon ?? undefined,
      });

      if (!item) {
        throw new GraphQLError("Item not found", {
          extensions: { code: "NOT_FOUND" },
        });
      }

      // Load links for the item
      const links = await wishlistService.getItemLinks(item.id);
      return mapItem(item, links);
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
      const link = await wishlistService.createItemLink({
        item_id: args.itemId,
        url: args.input.url,
        description: args.input.description ?? null,
        is_primary: args.input.isPrimary ?? false,
      });
      return mapLink(link);
    },
    updateItemLink: async (_parent, args, context) => {
      if (!context.user) {
        throw new GraphQLError("Not authenticated", {
          extensions: { code: "UNAUTHENTICATED" },
        });
      }

      const wishlistService = new WishlistService(context.db);
      const link = await wishlistService.updateItemLink(args.id, {
        url: args.input.url ?? undefined,
        description: args.input.description ?? undefined,
        is_primary: args.input.isPrimary ?? undefined,
      });

      return link ? mapLink(link) : null;
    },
    deleteItemLink: async (_parent, args, context) => {
      if (!context.user) {
        throw new GraphQLError("Not authenticated", {
          extensions: { code: "UNAUTHENTICATED" },
        });
      }

      const wishlistService = new WishlistService(context.db);
      await wishlistService.deleteItemLink(args.id);
      return true;
    },
    setPrimaryLink: async (_parent, args, context) => {
      if (!context.user) {
        throw new GraphQLError("Not authenticated", {
          extensions: { code: "UNAUTHENTICATED" },
        });
      }

      const wishlistService = new WishlistService(context.db);
      await wishlistService.setPrimaryLink(args.itemId, args.linkId);
      return true;
    },
  },
  WishlistItem: {
    links: async (parent, _args, context) => {
      // If links are already loaded, return them
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((parent as any).links) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (parent as any).links;
      }

      // Otherwise, lazy-load links
      const wishlistService = new WishlistService(context.db);
      const links = await wishlistService.getItemLinks(parent.id);
      return links.map(mapLink);
    },
  },
};
