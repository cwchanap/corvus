/**
 * Exercises the graphql/index.ts barrel re-export so it shows up as covered.
 */
import { describe, it, expect } from "vitest";
import * as graphqlBarrel from "../src/graphql/index";

const EXPECTED_RUNTIME_EXPORTS = [
    // client
    "graphqlRequest",
    // operations/auth
    "ME_QUERY",
    "REGISTER_MUTATION",
    "LOGIN_MUTATION",
    "LOGOUT_MUTATION",
    "getCurrentUser",
    "register",
    "login",
    "logout",
    // operations/wishlist
    "WISHLIST_QUERY",
    "CATEGORIES_QUERY",
    "ITEM_QUERY",
    "CREATE_CATEGORY_MUTATION",
    "UPDATE_CATEGORY_MUTATION",
    "DELETE_CATEGORY_MUTATION",
    "CREATE_ITEM_MUTATION",
    "UPDATE_ITEM_MUTATION",
    "DELETE_ITEM_MUTATION",
    "ADD_ITEM_LINK_MUTATION",
    "UPDATE_ITEM_LINK_MUTATION",
    "DELETE_ITEM_LINK_MUTATION",
    "SET_PRIMARY_LINK_MUTATION",
    "BATCH_DELETE_ITEMS_MUTATION",
    "BATCH_MOVE_ITEMS_MUTATION",
    "getWishlist",
    "getCategories",
    "getItem",
    "createCategory",
    "updateCategory",
    "deleteCategory",
    "createItem",
    "updateItem",
    "deleteItem",
    "addItemLink",
    "updateItemLink",
    "deleteItemLink",
    "setPrimaryLink",
    "batchDeleteItems",
    "batchMoveItems",
];

describe("graphql barrel (src/graphql/index.ts)", () => {
    it("re-exports graphqlRequest as a function", () => {
        expect(typeof graphqlBarrel.graphqlRequest).toBe("function");
    });

    it.each(EXPECTED_RUNTIME_EXPORTS)("barrel exports '%s'", (name) => {
        expect(graphqlBarrel).toHaveProperty(name);
    });
});
