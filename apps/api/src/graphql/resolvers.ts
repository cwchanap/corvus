/* eslint-disable @typescript-eslint/no-unused-vars */
import type { Resolvers } from "./types.js";

/**
 * GraphQL resolvers
 * These will be implemented in Phase 2
 */
export const resolvers: Resolvers = {
  Query: {
    me: async (_parent, _args, context) => {
      // TODO: Implement in Phase 2
      return context.user;
    },
    wishlist: async (_parent, _args, _context) => {
      // TODO: Implement in Phase 2
      throw new Error("Not implemented yet");
    },
    categories: async (_parent, _args, _context) => {
      // TODO: Implement in Phase 2
      throw new Error("Not implemented yet");
    },
    item: async (_parent, _args, _context) => {
      // TODO: Implement in Phase 2
      throw new Error("Not implemented yet");
    },
  },
  Mutation: {
    register: async (_parent, _args, _context) => {
      // TODO: Implement in Phase 2
      throw new Error("Not implemented yet");
    },
    login: async (_parent, _args, _context) => {
      // TODO: Implement in Phase 2
      throw new Error("Not implemented yet");
    },
    logout: async (_parent, _args, _context) => {
      // TODO: Implement in Phase 2
      throw new Error("Not implemented yet");
    },
    createCategory: async (_parent, _args, _context) => {
      // TODO: Implement in Phase 2
      throw new Error("Not implemented yet");
    },
    updateCategory: async (_parent, _args, _context) => {
      // TODO: Implement in Phase 2
      throw new Error("Not implemented yet");
    },
    deleteCategory: async (_parent, _args, _context) => {
      // TODO: Implement in Phase 2
      throw new Error("Not implemented yet");
    },
    createItem: async (_parent, _args, _context) => {
      // TODO: Implement in Phase 2
      throw new Error("Not implemented yet");
    },
    updateItem: async (_parent, _args, _context) => {
      // TODO: Implement in Phase 2
      throw new Error("Not implemented yet");
    },
    deleteItem: async (_parent, _args, _context) => {
      // TODO: Implement in Phase 2
      throw new Error("Not implemented yet");
    },
    addItemLink: async (_parent, _args, _context) => {
      // TODO: Implement in Phase 2
      throw new Error("Not implemented yet");
    },
    updateItemLink: async (_parent, _args, _context) => {
      // TODO: Implement in Phase 2
      throw new Error("Not implemented yet");
    },
    deleteItemLink: async (_parent, _args, _context) => {
      // TODO: Implement in Phase 2
      throw new Error("Not implemented yet");
    },
    setPrimaryLink: async (_parent, _args, _context) => {
      // TODO: Implement in Phase 2
      throw new Error("Not implemented yet");
    },
  },
  WishlistItem: {
    links: async (parent, _args, _context) => {
      // TODO: Implement field resolver in Phase 2
      // For now, return empty array or already loaded links
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (parent as any).links || [];
    },
  },
};
