import { describe, expect, it, vi, beforeEach } from "vitest";
import { GraphQLError } from "graphql";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { GraphQLContext } from "../../src/graphql/context";
import { resolvers } from "../../src/graphql/resolvers";
import type { DB } from "../../src/lib/db";
import * as migrations from "../../src/lib/db/migrations";
import {
    AuthServiceError,
    SupabaseAuthService,
} from "../../src/lib/auth/service";

vi.mock("../../src/lib/db/migrations", () => ({
    createDefaultCategories: vi.fn().mockResolvedValue(undefined),
}));

const mockCreateDefaultCategories =
    migrations.createDefaultCategories as ReturnType<typeof vi.fn>;

// ---------------------------------------------------------------------------
// WishlistService mock
// ---------------------------------------------------------------------------
const mockWishlistService = {
    getUserWishlistData: vi.fn(),
    getUserCategories: vi.fn(),
    getUserItems: vi.fn(),
    getItemById: vi.fn(),
    getItemLinks: vi.fn(),
    createCategory: vi.fn(),
    updateCategory: vi.fn(),
    deleteCategory: vi.fn(),
    createItem: vi.fn(),
    createItemWithPrimaryLink: vi.fn(),
    updateItem: vi.fn(),
    deleteItem: vi.fn(),
    createItemLink: vi.fn(),
    updateItemLink: vi.fn(),
    deleteItemLink: vi.fn(),
    setPrimaryLink: vi.fn(),
    batchDeleteItems: vi.fn(),
    batchMoveItems: vi.fn(),
    checkDuplicateUrl: vi.fn(),
    getRecentItems: vi.fn(),
};

vi.mock("../../src/lib/wishlist/service", async (importOriginal) => {
    const original =
        await importOriginal<typeof import("../../src/lib/wishlist/service")>();
    return {
        ...original,
        WishlistService: vi.fn(() => mockWishlistService),
    };
});

import { WishlistAuthorizationError } from "../../src/lib/wishlist/service";

// ---------------------------------------------------------------------------
// Context helpers
// ---------------------------------------------------------------------------
const mockUser = {
    id: "user-1",
    email: "test@example.com",
    name: "Test User",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
};

function createContext(
    authOverrides: Partial<{
        signInWithPassword: ReturnType<typeof vi.fn>;
        signUp: ReturnType<typeof vi.fn>;
        signOut: ReturnType<typeof vi.fn>;
    }> = {},
    user: typeof mockUser | null = null,
): GraphQLContext {
    return {
        db: {} as DB,
        user,
        supabase: {
            auth: {
                signInWithPassword: vi.fn(),
                signUp: vi.fn(),
                signOut: vi.fn().mockResolvedValue({ error: null }),
                ...authOverrides,
            },
        } as unknown as SupabaseClient,
        request: new Request("https://app.example.com/graphql"),
        honoContext: {} as GraphQLContext["honoContext"],
    };
}

function createAuthenticatedContext(
    authOverrides: Parameters<typeof createContext>[0] = {},
) {
    return createContext(authOverrides, mockUser);
}

// ---------------------------------------------------------------------------
// Resolver invokers
// ---------------------------------------------------------------------------
function invokeResolver<
    TParent,
    TArgs,
    TResult,
    TType extends "Query" | "Mutation" | "WishlistItem",
>(
    type: TType,
    name: string,
    args: TArgs,
    context: GraphQLContext,
    parent?: TParent,
) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const resolver = (resolvers as any)[type]?.[name];
    if (!resolver) throw new Error(`Resolver ${type}.${name} not found`);
    return resolver(
        parent ?? {},
        args,
        context,
        {} as never,
    ) as Promise<TResult>;
}

async function invokeLogin(context: GraphQLContext) {
    const loginResolver = resolvers.Mutation?.login;
    if (!loginResolver) throw new Error("Login resolver is unavailable");
    return loginResolver(
        {},
        { input: { email: "test@example.com", password: "password123" } },
        context,
        {} as never,
    );
}

async function invokeRegister(context: GraphQLContext) {
    const registerResolver = resolvers.Mutation?.register;
    if (!registerResolver) throw new Error("Register resolver is unavailable");
    return registerResolver(
        {},
        {
            input: {
                email: "test@example.com",
                password: "password123",
                name: "Test User",
            },
        },
        context,
        {} as never,
    );
}

// ---------------------------------------------------------------------------
// Shared DB fixtures
// ---------------------------------------------------------------------------
const dbCategory = {
    id: "cat-1",
    user_id: "user-1",
    name: "General",
    color: "#ff0000",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
};

const dbItem = {
    id: "item-1",
    user_id: "user-1",
    category_id: "cat-1",
    title: "My Item",
    description: null,
    favicon: null,
    status: "want" as const,
    priority: null,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
};

const dbLink = {
    id: "link-1",
    item_id: "item-1",
    url: "https://example.com",
    description: null,
    is_primary: true,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
};

// ---------------------------------------------------------------------------
// Query.me
// ---------------------------------------------------------------------------
describe("Query.me", () => {
    it("returns mapped user when context has a user", async () => {
        const ctx = createAuthenticatedContext();
        const result = await invokeResolver("Query", "me", {}, ctx);
        expect(result).toMatchObject({
            id: "user-1",
            email: "test@example.com",
            name: "Test User",
        });
    });

    it("returns null when no user in context", async () => {
        const ctx = createContext();
        const result = await invokeResolver("Query", "me", {}, ctx);
        expect(result).toBeNull();
    });
});

// ---------------------------------------------------------------------------
// Query.wishlist
// ---------------------------------------------------------------------------
describe("Query.wishlist", () => {
    beforeEach(() => vi.clearAllMocks());

    it("throws UNAUTHENTICATED when not logged in", async () => {
        await expect(
            invokeResolver(
                "Query",
                "wishlist",
                { pagination: null, filter: null },
                createContext(),
            ),
        ).rejects.toMatchObject({ extensions: { code: "UNAUTHENTICATED" } });
    });

    it("returns wishlist data for authenticated user", async () => {
        mockWishlistService.getUserWishlistData.mockResolvedValue({
            categories: [dbCategory],
            items: [{ ...dbItem, links: [dbLink] }],
            pagination: {
                total_items: 1,
                page: 1,
                page_size: 10,
                total_pages: 1,
                has_next: false,
                has_previous: false,
            },
        });

        const result = await invokeResolver(
            "Query",
            "wishlist",
            { pagination: { page: 1, pageSize: 10 }, filter: null },
            createAuthenticatedContext(),
        );

        expect(result).toMatchObject({
            categories: [expect.objectContaining({ id: "cat-1" })],
            items: [expect.objectContaining({ id: "item-1" })],
            pagination: expect.objectContaining({ totalItems: 1, page: 1 }),
        });
    });

    it("clamps pageSize to max 50", async () => {
        mockWishlistService.getUserWishlistData.mockResolvedValue({
            categories: [],
            items: [],
            pagination: {
                total_items: 0,
                page: 1,
                page_size: 50,
                total_pages: 0,
                has_next: false,
                has_previous: false,
            },
        });

        await invokeResolver(
            "Query",
            "wishlist",
            { pagination: { page: 1, pageSize: 999 }, filter: null },
            createAuthenticatedContext(),
        );

        expect(mockWishlistService.getUserWishlistData).toHaveBeenCalledWith(
            "user-1",
            expect.objectContaining({ limit: 50 }),
        );
    });

    it("passes filter values to service when filter is provided", async () => {
        // Covers lines 37-40: the ?. optional chain when args.filter is not null
        mockWishlistService.getUserWishlistData.mockResolvedValue({
            categories: [],
            items: [],
            pagination: {
                total_items: 0,
                page: 1,
                page_size: 10,
                total_pages: 0,
                has_next: false,
                has_previous: false,
            },
        });

        await invokeResolver(
            "Query",
            "wishlist",
            {
                pagination: { page: 1, pageSize: 10 },
                filter: {
                    categoryId: "cat-1",
                    search: "laptop",
                    status: "PURCHASED",
                    sortBy: "TITLE",
                    sortDir: "ASC",
                },
            },
            createAuthenticatedContext(),
        );

        expect(mockWishlistService.getUserWishlistData).toHaveBeenCalledWith(
            "user-1",
            expect.objectContaining({
                categoryId: "cat-1",
                search: "laptop",
                status: "purchased",
                sortBy: "TITLE",
                sortDir: "ASC",
            }),
        );
    });

    it("passes ALL status through to service unchanged", async () => {
        mockWishlistService.getUserWishlistData.mockResolvedValue({
            categories: [],
            items: [],
            pagination: {
                total_items: 0,
                page: 1,
                page_size: 10,
                total_pages: 0,
                has_next: false,
                has_previous: false,
            },
        });

        await invokeResolver(
            "Query",
            "wishlist",
            {
                pagination: { page: 1, pageSize: 10 },
                filter: {
                    status: "ALL",
                },
            },
            createAuthenticatedContext(),
        );

        expect(mockWishlistService.getUserWishlistData).toHaveBeenCalledWith(
            "user-1",
            expect.objectContaining({
                status: "ALL",
            }),
        );
    });

    it("uses defaults when pagination/filter not provided", async () => {
        mockWishlistService.getUserWishlistData.mockResolvedValue({
            categories: [],
            items: [],
            pagination: {
                total_items: 0,
                page: 1,
                page_size: 10,
                total_pages: 0,
                has_next: false,
                has_previous: false,
            },
        });

        await invokeResolver(
            "Query",
            "wishlist",
            {},
            createAuthenticatedContext(),
        );

        expect(mockWishlistService.getUserWishlistData).toHaveBeenCalledWith(
            "user-1",
            expect.objectContaining({ limit: 10, offset: 0 }),
        );
    });
});

// ---------------------------------------------------------------------------
// Query.categories
// ---------------------------------------------------------------------------
describe("Query.categories", () => {
    beforeEach(() => vi.clearAllMocks());

    it("throws UNAUTHENTICATED when not logged in", async () => {
        await expect(
            invokeResolver("Query", "categories", {}, createContext()),
        ).rejects.toMatchObject({ extensions: { code: "UNAUTHENTICATED" } });
    });

    it("returns mapped categories for authenticated user", async () => {
        mockWishlistService.getUserCategories.mockResolvedValue([dbCategory]);

        const result = await invokeResolver(
            "Query",
            "categories",
            {},
            createAuthenticatedContext(),
        );

        expect(result).toEqual([
            expect.objectContaining({
                id: "cat-1",
                name: "General",
                userId: "user-1",
            }),
        ]);
    });
});

// ---------------------------------------------------------------------------
// Query.item
// ---------------------------------------------------------------------------
describe("Query.item", () => {
    beforeEach(() => vi.clearAllMocks());

    it("throws UNAUTHENTICATED when not logged in", async () => {
        await expect(
            invokeResolver("Query", "item", { id: "item-1" }, createContext()),
        ).rejects.toMatchObject({ extensions: { code: "UNAUTHENTICATED" } });
    });

    it("returns null when item not found", async () => {
        mockWishlistService.getItemById.mockResolvedValue(undefined);

        const result = await invokeResolver(
            "Query",
            "item",
            { id: "item-1" },
            createAuthenticatedContext(),
        );

        expect(result).toBeNull();
    });

    it("returns mapped item with links when found", async () => {
        mockWishlistService.getItemById.mockResolvedValue(dbItem);
        mockWishlistService.getItemLinks.mockResolvedValue([dbLink]);

        const result = await invokeResolver(
            "Query",
            "item",
            { id: "item-1" },
            createAuthenticatedContext(),
        );

        expect(result).toMatchObject({ id: "item-1" });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect((result as any).links).toHaveLength(1);
    });

    it("throws FORBIDDEN on WishlistAuthorizationError from getItemLinks", async () => {
        mockWishlistService.getItemById.mockResolvedValue(dbItem);
        mockWishlistService.getItemLinks.mockRejectedValue(
            new WishlistAuthorizationError("Not authorized"),
        );

        await expect(
            invokeResolver(
                "Query",
                "item",
                { id: "item-1" },
                createAuthenticatedContext(),
            ),
        ).rejects.toMatchObject({ extensions: { code: "FORBIDDEN" } });
    });

    it("re-throws non-authorization errors from getItemLinks in Query.item", async () => {
        mockWishlistService.getItemById.mockResolvedValue(dbItem);
        const dbError = new Error("DB read failed");
        mockWishlistService.getItemLinks.mockRejectedValue(dbError);

        await expect(
            invokeResolver(
                "Query",
                "item",
                { id: "item-1" },
                createAuthenticatedContext(),
            ),
        ).rejects.toThrow("DB read failed");
    });
});

// ---------------------------------------------------------------------------
// Mutation.logout
// ---------------------------------------------------------------------------
describe("Mutation.logout", () => {
    it("returns true on successful logout", async () => {
        const ctx = createAuthenticatedContext({
            signOut: vi.fn().mockResolvedValue({ error: null }),
        });
        const result = await invokeResolver("Mutation", "logout", {}, ctx);
        expect(result).toBe(true);
    });

    it("throws INTERNAL_SERVER_ERROR when logout fails", async () => {
        const ctx = createAuthenticatedContext({
            signOut: vi.fn().mockRejectedValue(new Error("Network error")),
        });
        await expect(
            invokeResolver("Mutation", "logout", {}, ctx),
        ).rejects.toMatchObject({
            extensions: { code: "INTERNAL_SERVER_ERROR" },
        });
    });
});

// ---------------------------------------------------------------------------
// Mutation.login
// ---------------------------------------------------------------------------
describe("login resolver", () => {
    it("returns a rate-limited GraphQLError for rate-limited auth failures", async () => {
        const context = createContext({
            signInWithPassword: vi.fn().mockResolvedValue({
                data: { user: null },
                error: {
                    __isAuthError: true,
                    name: "AuthApiError",
                    message: "Too many requests",
                    status: 429,
                },
            }),
        });

        await expect(invokeLogin(context)).rejects.toBeInstanceOf(GraphQLError);

        try {
            await invokeLogin(context);
        } catch (error) {
            expect(error).toBeInstanceOf(GraphQLError);
            expect(error).toMatchObject({
                message: "Too many login attempts. Please wait and try again.",
                extensions: {
                    code: "RATE_LIMITED",
                    status: 429,
                },
            });
        }
    });

    it("returns a service-unavailable GraphQLError for transient auth failures", async () => {
        const context = createContext({
            signInWithPassword: vi.fn().mockResolvedValue({
                data: { user: null },
                error: {
                    __isAuthError: true,
                    name: "AuthRetryableFetchError",
                    message: "Network request failed",
                },
            }),
        });

        await expect(invokeLogin(context)).rejects.toBeInstanceOf(GraphQLError);

        try {
            await invokeLogin(context);
        } catch (error) {
            expect(error).toBeInstanceOf(GraphQLError);
            expect(error).toMatchObject({
                message: "Login is temporarily unavailable. Please try again.",
                extensions: {
                    code: "SERVICE_UNAVAILABLE",
                    status: 503,
                },
            });
        }
    });

    it("returns a bad-user-input GraphQLError for unconfirmed accounts", async () => {
        const context = createContext({
            signInWithPassword: vi.fn().mockResolvedValue({
                data: { user: null },
                error: {
                    __isAuthError: true,
                    name: "AuthApiError",
                    message: "Email not confirmed",
                    status: 400,
                },
            }),
        });

        await expect(invokeLogin(context)).rejects.toBeInstanceOf(GraphQLError);

        try {
            await invokeLogin(context);
        } catch (error) {
            expect(error).toBeInstanceOf(GraphQLError);
            expect(error).toMatchObject({
                message: "Please confirm your email before logging in.",
                extensions: {
                    code: "BAD_USER_INPUT",
                    status: 400,
                },
            });
        }
    });

    it("returns invalid credentials payload when user is null with no error", async () => {
        const context = createContext({
            signInWithPassword: vi.fn().mockResolvedValue({
                data: { user: null, session: null },
                error: null,
            }),
        });

        const result = await invokeLogin(context);
        expect(result).toMatchObject({
            success: false,
            user: null,
            error: "Invalid email or password",
        });
    });

    it("returns success payload on valid credentials", async () => {
        // SupabaseAuthService.login maps the supabase user directly via toPublicUser.
        // createDefaultCategories errors are swallowed (non-fatal), so login succeeds
        // even when db is an empty object.
        const supabaseUser = {
            id: "user-1",
            email: "test@example.com",
            user_metadata: { name: "Test User" },
        };
        const context = createContext({
            signInWithPassword: vi.fn().mockResolvedValue({
                data: { user: supabaseUser, session: { access_token: "tok" } },
                error: null,
            }),
        });

        const result = await invokeLogin(context);
        expect(result).toMatchObject({
            success: true,
            user: expect.objectContaining({
                id: "user-1",
                email: "test@example.com",
            }),
            error: null,
        });
    });
});

// ---------------------------------------------------------------------------
// Mutation.register
// ---------------------------------------------------------------------------
describe("register resolver", () => {
    it("returns a handled error when signup requires email confirmation but no user is returned", async () => {
        const context = createContext({
            signUp: vi.fn().mockResolvedValue({
                data: { user: null, session: null },
                error: null,
            }),
        });

        await expect(invokeRegister(context)).resolves.toEqual({
            success: false,
            user: null,
            error: "Registration failed: check your email to confirm",
        });
    });

    it("returns a handled error when the user already exists", async () => {
        const context = createContext({
            signUp: vi.fn().mockResolvedValue({
                data: { user: null, session: null },
                error: { message: "User already registered" },
            }),
        });

        await expect(invokeRegister(context)).resolves.toEqual({
            success: false,
            user: null,
            error: "User already exists",
        });
    });

    it("returns a handled error when registration setup fails (REGISTRATION_SETUP_FAILED)", async () => {
        // signUp succeeds with user + session, but createDefaultCategories fails,
        // causing clearServerSession to be called → SupabaseAuthService.register throws
        // REGISTRATION_SETUP_FAILED → toRegisterErrorPayload matches that code and returns the error payload
        mockCreateDefaultCategories.mockRejectedValueOnce(
            new Error("DB setup failed"),
        );
        const supabaseUser = {
            id: "new-user-1",
            email: "test@example.com",
            user_metadata: { name: "Test User" },
            identities: [{ id: "id-1" }],
            created_at: "2024-01-01T00:00:00Z",
            updated_at: "2024-01-01T00:00:00Z",
        };
        const context = createContext(
            {
                signUp: vi.fn().mockResolvedValue({
                    data: {
                        user: supabaseUser,
                        session: { access_token: "tok" },
                    },
                    error: null,
                }),
                // signOut is used by clearServerSession; success → no re-throw
                signOut: vi.fn().mockResolvedValue({ error: null }),
            },
            null,
        );
        // context.db is {} as DB, so db.insert is not a function → createDefaultCategories throws

        const result = await invokeRegister(context);
        expect(result).toMatchObject({
            success: false,
            user: null,
        });
        expect(typeof (result as { error: unknown }).error).toBe("string");
    });

    it("throws INTERNAL_SERVER_ERROR when AuthServiceError has an unrecognized code during register (covers toRegisterErrorPayload return null)", async () => {
        // An auth error message that doesn't include "already registered" triggers
        // the UNKNOWN code in SupabaseAuthService.register (line 64-73 of service.ts).
        // toRegisterErrorPayload returns null for UNKNOWN → falls through to INTERNAL_SERVER_ERROR
        // (covers lines 582-583 of resolvers.ts)
        const context = createContext({
            signUp: vi.fn().mockResolvedValue({
                data: { user: null, session: null },
                error: { message: "Some unexpected auth failure" },
            }),
        });

        await expect(invokeRegister(context)).rejects.toMatchObject({
            message: "Registration failed",
            extensions: { code: "INTERNAL_SERVER_ERROR" },
        });
    });
});

// ---------------------------------------------------------------------------
// login resolver – error fallthrough paths
// ---------------------------------------------------------------------------
describe("login resolver error fallthrough", () => {
    it("throws INTERNAL_SERVER_ERROR when signInWithPassword rejects with a plain Error", async () => {
        // signInWithPassword throws (not returns) an error → propagates as a
        // non-AuthServiceError → toLoginGraphQLError returns null → falls through
        // to the generic INTERNAL_SERVER_ERROR branch (covers lines 586-588)
        const context = createContext({
            signInWithPassword: vi
                .fn()
                .mockRejectedValue(new Error("Unexpected network failure")),
        });

        await expect(invokeLogin(context)).rejects.toMatchObject({
            message: "Login failed",
            extensions: { code: "INTERNAL_SERVER_ERROR" },
        });
    });

    it("throws INTERNAL_SERVER_ERROR when AuthServiceError has UNKNOWN code", async () => {
        // An unrecognised Supabase error maps to UNKNOWN in createLoginError.
        // toLoginGraphQLError finds no matching branch and returns null (line 626),
        // so the resolver falls through to the generic error (covers lines 626-627)
        const context = createContext({
            signInWithPassword: vi.fn().mockResolvedValue({
                data: { user: null },
                error: {
                    __isAuthError: true,
                    name: "AuthApiError",
                    message: "Something unexpected happened",
                    status: 400,
                },
            }),
        });

        await expect(invokeLogin(context)).rejects.toMatchObject({
            message: "Login failed",
            extensions: { code: "INTERNAL_SERVER_ERROR" },
        });
    });
});

// ---------------------------------------------------------------------------
// Mutation.createCategory
// ---------------------------------------------------------------------------
describe("Mutation.createCategory", () => {
    beforeEach(() => vi.clearAllMocks());

    it("throws UNAUTHENTICATED when not logged in", async () => {
        await expect(
            invokeResolver(
                "Mutation",
                "createCategory",
                { input: { name: "Work", color: null } },
                createContext(),
            ),
        ).rejects.toMatchObject({ extensions: { code: "UNAUTHENTICATED" } });
    });

    it("returns mapped category on success", async () => {
        mockWishlistService.createCategory.mockResolvedValue(dbCategory);

        const result = await invokeResolver(
            "Mutation",
            "createCategory",
            { input: { name: "General", color: "#ff0000" } },
            createAuthenticatedContext(),
        );

        expect(result).toMatchObject({
            id: "cat-1",
            name: "General",
            color: "#ff0000",
        });
    });

    it("passes null when color not provided", async () => {
        mockWishlistService.createCategory.mockResolvedValue({
            ...dbCategory,
            color: null,
        });

        await invokeResolver(
            "Mutation",
            "createCategory",
            { input: { name: "General", color: null } },
            createAuthenticatedContext(),
        );

        expect(mockWishlistService.createCategory).toHaveBeenCalledWith(
            expect.objectContaining({ color: null }),
        );
    });
});

// ---------------------------------------------------------------------------
// Mutation.updateCategory
// ---------------------------------------------------------------------------
describe("Mutation.updateCategory", () => {
    beforeEach(() => vi.clearAllMocks());

    it("throws UNAUTHENTICATED when not logged in", async () => {
        await expect(
            invokeResolver(
                "Mutation",
                "updateCategory",
                { id: "cat-1", input: {} },
                createContext(),
            ),
        ).rejects.toMatchObject({ extensions: { code: "UNAUTHENTICATED" } });
    });

    it("returns mapped category when found", async () => {
        mockWishlistService.updateCategory.mockResolvedValue(dbCategory);

        const result = await invokeResolver(
            "Mutation",
            "updateCategory",
            { id: "cat-1", input: { name: "Updated" } },
            createAuthenticatedContext(),
        );

        expect(result).toMatchObject({ id: "cat-1" });
    });

    it("returns null when category not found", async () => {
        mockWishlistService.updateCategory.mockResolvedValue(null);

        const result = await invokeResolver(
            "Mutation",
            "updateCategory",
            { id: "cat-1", input: {} },
            createAuthenticatedContext(),
        );

        expect(result).toBeNull();
    });
});

// ---------------------------------------------------------------------------
// Mutation.deleteCategory
// ---------------------------------------------------------------------------
describe("Mutation.deleteCategory", () => {
    beforeEach(() => vi.clearAllMocks());

    it("throws UNAUTHENTICATED when not logged in", async () => {
        await expect(
            invokeResolver(
                "Mutation",
                "deleteCategory",
                { id: "cat-1" },
                createContext(),
            ),
        ).rejects.toMatchObject({ extensions: { code: "UNAUTHENTICATED" } });
    });

    it("returns true on success", async () => {
        mockWishlistService.deleteCategory.mockResolvedValue(undefined);

        const result = await invokeResolver(
            "Mutation",
            "deleteCategory",
            { id: "cat-1" },
            createAuthenticatedContext(),
        );

        expect(result).toBe(true);
    });
});

// ---------------------------------------------------------------------------
// Mutation.createItem
// ---------------------------------------------------------------------------
describe("Mutation.createItem", () => {
    beforeEach(() => vi.clearAllMocks());

    it("throws UNAUTHENTICATED when not logged in", async () => {
        await expect(
            invokeResolver(
                "Mutation",
                "createItem",
                { input: { categoryId: "cat-1", title: "Item" } },
                createContext(),
            ),
        ).rejects.toMatchObject({ extensions: { code: "UNAUTHENTICATED" } });
    });

    it("creates item without link when no url provided", async () => {
        mockWishlistService.createItem.mockResolvedValue(dbItem);

        const result = await invokeResolver(
            "Mutation",
            "createItem",
            { input: { categoryId: "cat-1", title: "My Item" } },
            createAuthenticatedContext(),
        );

        expect(mockWishlistService.createItem).toHaveBeenCalled();
        expect(
            mockWishlistService.createItemWithPrimaryLink,
        ).not.toHaveBeenCalled();
        expect(result).toMatchObject({ id: "item-1" });
    });

    it("creates item with primary link when url provided", async () => {
        mockWishlistService.createItemWithPrimaryLink.mockResolvedValue({
            item: dbItem,
            link: dbLink,
        });

        const result = await invokeResolver(
            "Mutation",
            "createItem",
            {
                input: {
                    categoryId: "cat-1",
                    title: "My Item",
                    url: "https://example.com",
                },
            },
            createAuthenticatedContext(),
        );

        expect(
            mockWishlistService.createItemWithPrimaryLink,
        ).toHaveBeenCalled();
        expect(result).toMatchObject({ id: "item-1" });
    });

    it("throws FORBIDDEN on WishlistAuthorizationError when creating with link", async () => {
        mockWishlistService.createItemWithPrimaryLink.mockRejectedValue(
            new WishlistAuthorizationError(),
        );

        await expect(
            invokeResolver(
                "Mutation",
                "createItem",
                {
                    input: {
                        categoryId: "cat-1",
                        title: "My Item",
                        url: "https://example.com",
                    },
                },
                createAuthenticatedContext(),
            ),
        ).rejects.toMatchObject({ extensions: { code: "FORBIDDEN" } });
    });

    it("re-throws non-authorization errors when creating with link", async () => {
        const dbError = new Error("Unexpected DB error");
        mockWishlistService.createItemWithPrimaryLink.mockRejectedValue(
            dbError,
        );

        await expect(
            invokeResolver(
                "Mutation",
                "createItem",
                {
                    input: {
                        categoryId: "cat-1",
                        title: "My Item",
                        url: "https://example.com",
                    },
                },
                createAuthenticatedContext(),
            ),
        ).rejects.toThrow("Unexpected DB error");
    });
});

// ---------------------------------------------------------------------------
// Mutation.updateItem
// ---------------------------------------------------------------------------
describe("Mutation.updateItem", () => {
    beforeEach(() => vi.clearAllMocks());

    it("throws UNAUTHENTICATED when not logged in", async () => {
        await expect(
            invokeResolver(
                "Mutation",
                "updateItem",
                { id: "item-1", input: {} },
                createContext(),
            ),
        ).rejects.toMatchObject({ extensions: { code: "UNAUTHENTICATED" } });
    });

    it("throws NOT_FOUND when item not found", async () => {
        mockWishlistService.updateItem.mockResolvedValue(null);

        await expect(
            invokeResolver(
                "Mutation",
                "updateItem",
                { id: "item-1", input: { title: "Updated" } },
                createAuthenticatedContext(),
            ),
        ).rejects.toMatchObject({ extensions: { code: "NOT_FOUND" } });
    });

    it("returns mapped item with links on success", async () => {
        mockWishlistService.updateItem.mockResolvedValue(dbItem);
        mockWishlistService.getItemLinks.mockResolvedValue([dbLink]);

        const result = await invokeResolver(
            "Mutation",
            "updateItem",
            { id: "item-1", input: { title: "Updated" } },
            createAuthenticatedContext(),
        );

        expect(result).toMatchObject({ id: "item-1" });
    });

    it("throws FORBIDDEN on WishlistAuthorizationError from getItemLinks", async () => {
        mockWishlistService.updateItem.mockResolvedValue(dbItem);
        mockWishlistService.getItemLinks.mockRejectedValue(
            new WishlistAuthorizationError(),
        );

        await expect(
            invokeResolver(
                "Mutation",
                "updateItem",
                { id: "item-1", input: {} },
                createAuthenticatedContext(),
            ),
        ).rejects.toMatchObject({ extensions: { code: "FORBIDDEN" } });
    });

    it("re-throws non-authorization errors from getItemLinks", async () => {
        mockWishlistService.updateItem.mockResolvedValue(dbItem);
        const dbError = new Error("Links query failed");
        mockWishlistService.getItemLinks.mockRejectedValue(dbError);

        await expect(
            invokeResolver(
                "Mutation",
                "updateItem",
                { id: "item-1", input: { title: "Updated" } },
                createAuthenticatedContext(),
            ),
        ).rejects.toThrow("Links query failed");
    });

    it("passes undefined for category_id when categoryId is not in input", async () => {
        mockWishlistService.updateItem.mockResolvedValue(dbItem);
        mockWishlistService.getItemLinks.mockResolvedValue([]);

        await invokeResolver(
            "Mutation",
            "updateItem",
            { id: "item-1", input: { title: "No Category Change" } },
            createAuthenticatedContext(),
        );

        expect(mockWishlistService.updateItem).toHaveBeenCalledWith(
            "item-1",
            expect.any(String),
            expect.objectContaining({ category_id: undefined }),
        );
    });

    it("passes categoryId value when categoryId is present in input", async () => {
        // Covers line 304: args.input.categoryId (the truthy branch of "categoryId" in args.input)
        mockWishlistService.updateItem.mockResolvedValue(dbItem);
        mockWishlistService.getItemLinks.mockResolvedValue([]);

        await invokeResolver(
            "Mutation",
            "updateItem",
            { id: "item-1", input: { title: "Updated", categoryId: "cat-2" } },
            createAuthenticatedContext(),
        );

        expect(mockWishlistService.updateItem).toHaveBeenCalledWith(
            "item-1",
            expect.any(String),
            expect.objectContaining({ category_id: "cat-2" }),
        );
    });
});

// ---------------------------------------------------------------------------
// Mutation.deleteItem
// ---------------------------------------------------------------------------
describe("Mutation.deleteItem", () => {
    beforeEach(() => vi.clearAllMocks());

    it("throws UNAUTHENTICATED when not logged in", async () => {
        await expect(
            invokeResolver(
                "Mutation",
                "deleteItem",
                { id: "item-1" },
                createContext(),
            ),
        ).rejects.toMatchObject({ extensions: { code: "UNAUTHENTICATED" } });
    });

    it("returns true on success", async () => {
        mockWishlistService.deleteItem.mockResolvedValue(undefined);

        const result = await invokeResolver(
            "Mutation",
            "deleteItem",
            { id: "item-1" },
            createAuthenticatedContext(),
        );

        expect(result).toBe(true);
    });
});

// ---------------------------------------------------------------------------
// Mutation.addItemLink
// ---------------------------------------------------------------------------
describe("Mutation.addItemLink", () => {
    beforeEach(() => vi.clearAllMocks());

    it("throws UNAUTHENTICATED when not logged in", async () => {
        await expect(
            invokeResolver(
                "Mutation",
                "addItemLink",
                { itemId: "item-1", input: { url: "https://example.com" } },
                createContext(),
            ),
        ).rejects.toMatchObject({ extensions: { code: "UNAUTHENTICATED" } });
    });

    it("returns mapped link on success", async () => {
        mockWishlistService.createItemLink.mockResolvedValue(dbLink);

        const result = await invokeResolver(
            "Mutation",
            "addItemLink",
            {
                itemId: "item-1",
                input: { url: "https://example.com", isPrimary: true },
            },
            createAuthenticatedContext(),
        );

        expect(result).toMatchObject({
            id: "link-1",
            url: "https://example.com",
        });
    });

    it("throws FORBIDDEN on WishlistAuthorizationError", async () => {
        mockWishlistService.createItemLink.mockRejectedValue(
            new WishlistAuthorizationError(),
        );

        await expect(
            invokeResolver(
                "Mutation",
                "addItemLink",
                { itemId: "item-1", input: { url: "https://example.com" } },
                createAuthenticatedContext(),
            ),
        ).rejects.toMatchObject({ extensions: { code: "FORBIDDEN" } });
    });

    it("re-throws non-authorization errors", async () => {
        const dbError = new Error("Database connection failed");
        mockWishlistService.createItemLink.mockRejectedValue(dbError);

        await expect(
            invokeResolver(
                "Mutation",
                "addItemLink",
                { itemId: "item-1", input: { url: "https://example.com" } },
                createAuthenticatedContext(),
            ),
        ).rejects.toThrow("Database connection failed");
    });
});

// ---------------------------------------------------------------------------
// Mutation.updateItemLink
// ---------------------------------------------------------------------------
describe("Mutation.updateItemLink", () => {
    beforeEach(() => vi.clearAllMocks());

    it("throws UNAUTHENTICATED when not logged in", async () => {
        await expect(
            invokeResolver(
                "Mutation",
                "updateItemLink",
                { id: "link-1", input: {} },
                createContext(),
            ),
        ).rejects.toMatchObject({ extensions: { code: "UNAUTHENTICATED" } });
    });

    it("returns mapped link when found", async () => {
        mockWishlistService.updateItemLink.mockResolvedValue(dbLink);

        const result = await invokeResolver(
            "Mutation",
            "updateItemLink",
            { id: "link-1", input: { url: "https://updated.com" } },
            createAuthenticatedContext(),
        );

        expect(result).toMatchObject({ id: "link-1" });
    });

    it("returns null when link not found", async () => {
        mockWishlistService.updateItemLink.mockResolvedValue(null);

        const result = await invokeResolver(
            "Mutation",
            "updateItemLink",
            { id: "link-1", input: {} },
            createAuthenticatedContext(),
        );

        expect(result).toBeNull();
    });

    it("throws FORBIDDEN on WishlistAuthorizationError", async () => {
        mockWishlistService.updateItemLink.mockRejectedValue(
            new WishlistAuthorizationError(),
        );

        await expect(
            invokeResolver(
                "Mutation",
                "updateItemLink",
                { id: "link-1", input: {} },
                createAuthenticatedContext(),
            ),
        ).rejects.toMatchObject({ extensions: { code: "FORBIDDEN" } });
    });

    it("re-throws non-authorization errors", async () => {
        const dbError = new Error("Storage quota exceeded");
        mockWishlistService.updateItemLink.mockRejectedValue(dbError);

        await expect(
            invokeResolver(
                "Mutation",
                "updateItemLink",
                { id: "link-1", input: {} },
                createAuthenticatedContext(),
            ),
        ).rejects.toThrow("Storage quota exceeded");
    });
});

// ---------------------------------------------------------------------------
// Mutation.deleteItemLink
// ---------------------------------------------------------------------------
describe("Mutation.deleteItemLink", () => {
    beforeEach(() => vi.clearAllMocks());

    it("throws UNAUTHENTICATED when not logged in", async () => {
        await expect(
            invokeResolver(
                "Mutation",
                "deleteItemLink",
                { id: "link-1" },
                createContext(),
            ),
        ).rejects.toMatchObject({ extensions: { code: "UNAUTHENTICATED" } });
    });

    it("returns true on success", async () => {
        mockWishlistService.deleteItemLink.mockResolvedValue(undefined);

        const result = await invokeResolver(
            "Mutation",
            "deleteItemLink",
            { id: "link-1" },
            createAuthenticatedContext(),
        );

        expect(result).toBe(true);
    });

    it("throws FORBIDDEN on WishlistAuthorizationError", async () => {
        mockWishlistService.deleteItemLink.mockRejectedValue(
            new WishlistAuthorizationError(),
        );

        await expect(
            invokeResolver(
                "Mutation",
                "deleteItemLink",
                { id: "link-1" },
                createAuthenticatedContext(),
            ),
        ).rejects.toMatchObject({ extensions: { code: "FORBIDDEN" } });
    });

    it("re-throws non-WishlistAuthorizationError (covers line 418)", async () => {
        mockWishlistService.deleteItemLink.mockRejectedValue(
            new Error("DB error during deleteItemLink"),
        );

        await expect(
            invokeResolver(
                "Mutation",
                "deleteItemLink",
                { id: "link-1" },
                createAuthenticatedContext(),
            ),
        ).rejects.toThrow("DB error during deleteItemLink");
    });
});

// ---------------------------------------------------------------------------
// Mutation.setPrimaryLink
// ---------------------------------------------------------------------------
describe("Mutation.setPrimaryLink", () => {
    beforeEach(() => vi.clearAllMocks());

    it("throws UNAUTHENTICATED when not logged in", async () => {
        await expect(
            invokeResolver(
                "Mutation",
                "setPrimaryLink",
                { itemId: "item-1", linkId: "link-1" },
                createContext(),
            ),
        ).rejects.toMatchObject({ extensions: { code: "UNAUTHENTICATED" } });
    });

    it("returns true on success", async () => {
        mockWishlistService.setPrimaryLink.mockResolvedValue(undefined);

        const result = await invokeResolver(
            "Mutation",
            "setPrimaryLink",
            { itemId: "item-1", linkId: "link-1" },
            createAuthenticatedContext(),
        );

        expect(result).toBe(true);
    });

    it("throws FORBIDDEN on WishlistAuthorizationError", async () => {
        mockWishlistService.setPrimaryLink.mockRejectedValue(
            new WishlistAuthorizationError(),
        );

        await expect(
            invokeResolver(
                "Mutation",
                "setPrimaryLink",
                { itemId: "item-1", linkId: "link-1" },
                createAuthenticatedContext(),
            ),
        ).rejects.toMatchObject({ extensions: { code: "FORBIDDEN" } });
    });

    it("re-throws non-WishlistAuthorizationError (covers line 442)", async () => {
        mockWishlistService.setPrimaryLink.mockRejectedValue(
            new Error("DB error during setPrimaryLink"),
        );

        await expect(
            invokeResolver(
                "Mutation",
                "setPrimaryLink",
                { itemId: "item-1", linkId: "link-1" },
                createAuthenticatedContext(),
            ),
        ).rejects.toThrow("DB error during setPrimaryLink");
    });
});

// ---------------------------------------------------------------------------
// Mutation.batchDeleteItems
// ---------------------------------------------------------------------------
describe("Mutation.batchDeleteItems", () => {
    beforeEach(() => vi.clearAllMocks());

    it("throws UNAUTHENTICATED when not logged in", async () => {
        await expect(
            invokeResolver(
                "Mutation",
                "batchDeleteItems",
                { input: { itemIds: ["item-1"] } },
                createContext(),
            ),
        ).rejects.toMatchObject({ extensions: { code: "UNAUTHENTICATED" } });
    });

    it("throws BAD_USER_INPUT when itemIds is empty", async () => {
        await expect(
            invokeResolver(
                "Mutation",
                "batchDeleteItems",
                { input: { itemIds: [] } },
                createAuthenticatedContext(),
            ),
        ).rejects.toMatchObject({ extensions: { code: "BAD_USER_INPUT" } });
    });

    it("throws BAD_USER_INPUT when batch exceeds 100 items", async () => {
        await expect(
            invokeResolver(
                "Mutation",
                "batchDeleteItems",
                {
                    input: {
                        itemIds: Array.from(
                            { length: 101 },
                            (_, i) => `item-${i}`,
                        ),
                    },
                },
                createAuthenticatedContext(),
            ),
        ).rejects.toMatchObject({ extensions: { code: "BAD_USER_INPUT" } });
    });

    it("returns batch result on success", async () => {
        mockWishlistService.batchDeleteItems.mockResolvedValue({
            processedCount: 2,
            failedCount: 0,
            errors: [],
        });

        const result = await invokeResolver(
            "Mutation",
            "batchDeleteItems",
            { input: { itemIds: ["item-1", "item-2"] } },
            createAuthenticatedContext(),
        );

        expect(result).toMatchObject({
            success: true,
            processedCount: 2,
            failedCount: 0,
            errors: null,
        });
    });

    it("returns success=false when some items fail", async () => {
        mockWishlistService.batchDeleteItems.mockResolvedValue({
            processedCount: 2,
            failedCount: 1,
            errors: ["item-2: not found"],
        });

        const result = await invokeResolver(
            "Mutation",
            "batchDeleteItems",
            { input: { itemIds: ["item-1", "item-2"] } },
            createAuthenticatedContext(),
        );

        expect(result).toMatchObject({
            success: false,
            failedCount: 1,
            errors: ["item-2: not found"],
        });
    });
});

// ---------------------------------------------------------------------------
// Mutation.batchMoveItems
// ---------------------------------------------------------------------------
describe("Mutation.batchMoveItems", () => {
    beforeEach(() => vi.clearAllMocks());

    it("throws UNAUTHENTICATED when not logged in", async () => {
        await expect(
            invokeResolver(
                "Mutation",
                "batchMoveItems",
                { input: { itemIds: ["item-1"], categoryId: "cat-1" } },
                createContext(),
            ),
        ).rejects.toMatchObject({ extensions: { code: "UNAUTHENTICATED" } });
    });

    it("throws BAD_USER_INPUT when itemIds is empty", async () => {
        await expect(
            invokeResolver(
                "Mutation",
                "batchMoveItems",
                { input: { itemIds: [], categoryId: "cat-1" } },
                createAuthenticatedContext(),
            ),
        ).rejects.toMatchObject({ extensions: { code: "BAD_USER_INPUT" } });
    });

    it("throws BAD_USER_INPUT when batch exceeds 100 items", async () => {
        await expect(
            invokeResolver(
                "Mutation",
                "batchMoveItems",
                {
                    input: {
                        itemIds: Array.from(
                            { length: 101 },
                            (_, i) => `item-${i}`,
                        ),
                        categoryId: "cat-1",
                    },
                },
                createAuthenticatedContext(),
            ),
        ).rejects.toMatchObject({ extensions: { code: "BAD_USER_INPUT" } });
    });

    it("returns batch result on success", async () => {
        mockWishlistService.batchMoveItems.mockResolvedValue({
            processedCount: 3,
            failedCount: 0,
            errors: [],
        });

        const result = await invokeResolver(
            "Mutation",
            "batchMoveItems",
            {
                input: {
                    itemIds: ["item-1", "item-2", "item-3"],
                    categoryId: "cat-2",
                },
            },
            createAuthenticatedContext(),
        );

        expect(result).toMatchObject({
            success: true,
            processedCount: 3,
            errors: null,
        });
    });

    it("returns errors array when some items fail to move", async () => {
        // Covers line 515: result.errors.length > 0 ? result.errors : null (truthy branch)
        mockWishlistService.batchMoveItems.mockResolvedValue({
            processedCount: 1,
            failedCount: 2,
            errors: ["2 items not found or unauthorized"],
        });

        const result = await invokeResolver(
            "Mutation",
            "batchMoveItems",
            {
                input: {
                    itemIds: ["item-1", "item-2", "item-3"],
                    categoryId: "cat-2",
                },
            },
            createAuthenticatedContext(),
        );

        expect(result).toMatchObject({
            success: false,
            failedCount: 2,
            errors: ["2 items not found or unauthorized"],
        });
    });

    it("passes null categoryId when not provided", async () => {
        mockWishlistService.batchMoveItems.mockResolvedValue({
            processedCount: 1,
            failedCount: 0,
            errors: [],
        });

        await invokeResolver(
            "Mutation",
            "batchMoveItems",
            { input: { itemIds: ["item-1"] } },
            createAuthenticatedContext(),
        );

        expect(mockWishlistService.batchMoveItems).toHaveBeenCalledWith(
            ["item-1"],
            "user-1",
            null,
        );
    });
});

// ---------------------------------------------------------------------------
// WishlistItem.links field resolver
// ---------------------------------------------------------------------------
describe("WishlistItem.links", () => {
    beforeEach(() => vi.clearAllMocks());

    const gqlItem = {
        id: "item-1",
        userId: "user-1",
        categoryId: "cat-1",
        title: "My Item",
        description: null,
        favicon: null,
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
    };

    it("throws UNAUTHENTICATED when not logged in", async () => {
        await expect(
            invokeResolver(
                "WishlistItem",
                "links",
                {},
                createContext(),
                gqlItem,
            ),
        ).rejects.toMatchObject({ extensions: { code: "UNAUTHENTICATED" } });
    });

    it("returns already-loaded links without calling service", async () => {
        const parentWithLinks = {
            ...gqlItem,
            links: [{ id: "link-1", url: "https://example.com" }],
        };
        const result = await invokeResolver(
            "WishlistItem",
            "links",
            {},
            createAuthenticatedContext(),
            parentWithLinks,
        );

        expect(mockWishlistService.getItemLinks).not.toHaveBeenCalled();
        expect(result).toEqual(parentWithLinks.links);
    });

    it("lazy-loads links when not pre-loaded", async () => {
        mockWishlistService.getItemLinks.mockResolvedValue([dbLink]);

        const result = await invokeResolver(
            "WishlistItem",
            "links",
            {},
            createAuthenticatedContext(),
            gqlItem,
        );

        expect(mockWishlistService.getItemLinks).toHaveBeenCalledWith(
            "user-1",
            "item-1",
        );
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect((result as any[]).length).toBe(1);
    });

    it("throws FORBIDDEN on WishlistAuthorizationError during lazy-load", async () => {
        mockWishlistService.getItemLinks.mockRejectedValue(
            new WishlistAuthorizationError(),
        );

        await expect(
            invokeResolver(
                "WishlistItem",
                "links",
                {},
                createAuthenticatedContext(),
                gqlItem,
            ),
        ).rejects.toMatchObject({ extensions: { code: "FORBIDDEN" } });
    });

    it("re-throws non-WishlistAuthorizationError errors during lazy-load (covers line 548)", async () => {
        // getItemLinks throws a plain Error (not WishlistAuthorizationError) →
        // the catch block at line 547-548 re-throws it as-is
        const dbError = new Error("Database connection lost");
        mockWishlistService.getItemLinks.mockRejectedValue(dbError);

        await expect(
            invokeResolver(
                "WishlistItem",
                "links",
                {},
                createAuthenticatedContext(),
                gqlItem,
            ),
        ).rejects.toThrow("Database connection lost");
    });
});

// ---------------------------------------------------------------------------
// Additional register edge cases (covers remaining branches)
// ---------------------------------------------------------------------------
describe("register resolver – remaining edge cases", () => {
    it("returns success payload on successful registration", async () => {
        // Covers lines 126-130: the success return in the register resolver
        const supabaseUser = {
            id: "new-user-123",
            email: "newuser@example.com",
            user_metadata: { name: "New User" },
            identities: [{ id: "id-1" }],
            created_at: "2024-01-01T00:00:00Z",
            updated_at: "2024-01-01T00:00:00Z",
        };
        const context = createContext(
            {
                signUp: vi.fn().mockResolvedValue({
                    data: {
                        user: supabaseUser,
                        session: { access_token: "tok" },
                    },
                    error: null,
                }),
                signOut: vi.fn().mockResolvedValue({ error: null }),
            },
            null,
        );

        const result = await invokeRegister(context);

        expect(result).toMatchObject({
            success: true,
            user: expect.objectContaining({
                id: "new-user-123",
                email: "newuser@example.com",
            }),
            error: null,
        });
    });

    it("throws INTERNAL_SERVER_ERROR when signUp itself throws a plain Error (covers toRegisterErrorPayload guard line 560)", async () => {
        // When supabase.auth.signUp() throws (rather than returning { error }),
        // the plain Error propagates to the resolver's catch block.
        // toRegisterErrorPayload(plainError) sees !(plainError instanceof AuthServiceError)
        // → returns null → falls through to INTERNAL_SERVER_ERROR.
        const context = createContext({
            signUp: vi
                .fn()
                .mockRejectedValue(new Error("Network failure during signup")),
        });

        await expect(invokeRegister(context)).rejects.toMatchObject({
            message: "Registration failed",
            extensions: { code: "INTERNAL_SERVER_ERROR" },
        });
    });
});

// ---------------------------------------------------------------------------
// toLoginGraphQLError – null-coalescing fallback branches (lines 596 and 620)
// ---------------------------------------------------------------------------
describe("login resolver – toLoginGraphQLError status fallback", () => {
    it("falls back to status 429 when AuthServiceError.status is undefined for RATE_LIMITED (covers line 596)", async () => {
        // Bypass the Supabase client path to inject an AuthServiceError whose
        // .status is intentionally undefined, forcing the `?? 429` branch.
        const spy = vi
            .spyOn(SupabaseAuthService.prototype, "login")
            .mockRejectedValueOnce(
                new AuthServiceError("Login failed: rate limited", {
                    code: "RATE_LIMITED",
                    // status intentionally omitted → undefined
                }),
            );

        const context = createContext();
        try {
            await invokeLogin(context);
            throw new Error("Expected invokeLogin to throw");
        } catch (error) {
            expect(error).toBeInstanceOf(GraphQLError);
            expect(error).toMatchObject({
                extensions: { code: "RATE_LIMITED", status: 429 },
            });
        } finally {
            spy.mockRestore();
        }
    });

    it("falls back to status 400 when AuthServiceError.status is undefined for UNCONFIRMED_ACCOUNT (covers line 620)", async () => {
        const spy = vi
            .spyOn(SupabaseAuthService.prototype, "login")
            .mockRejectedValueOnce(
                new AuthServiceError("Login failed: email not confirmed", {
                    code: "UNCONFIRMED_ACCOUNT",
                    // status intentionally omitted → undefined
                }),
            );

        const context = createContext();
        try {
            await invokeLogin(context);
            throw new Error("Expected invokeLogin to throw");
        } catch (error) {
            expect(error).toBeInstanceOf(GraphQLError);
            expect(error).toMatchObject({
                extensions: { code: "BAD_USER_INPUT", status: 400 },
            });
        } finally {
            spy.mockRestore();
        }
    });
});

// ---------------------------------------------------------------------------
// Query.checkDuplicateUrl
// ---------------------------------------------------------------------------
describe("Query.checkDuplicateUrl", () => {
    beforeEach(() => vi.clearAllMocks());

    it("throws UNAUTHENTICATED when not logged in", async () => {
        await expect(
            invokeResolver(
                "Query",
                "checkDuplicateUrl",
                { url: "https://example.com" },
                createContext(),
            ),
        ).rejects.toThrow("Not authenticated");
    });

    it("returns duplicate check result from service", async () => {
        mockWishlistService.checkDuplicateUrl.mockResolvedValueOnce({
            isDuplicate: true,
            conflictingItem: dbItem,
        });

        const ctx = createAuthenticatedContext();
        const result = await invokeResolver(
            "Query",
            "checkDuplicateUrl",
            { url: "https://example.com", excludeItemId: undefined },
            ctx,
        );

        expect(result.isDuplicate).toBe(true);
        expect(result.conflictingItem).toMatchObject({ id: "item-1" });
        expect(mockWishlistService.checkDuplicateUrl).toHaveBeenCalledWith(
            "user-1",
            "https://example.com",
            undefined,
        );
    });

    it("passes excludeItemId to service", async () => {
        mockWishlistService.checkDuplicateUrl.mockResolvedValueOnce({
            isDuplicate: false,
            conflictingItem: null,
        });

        const ctx = createAuthenticatedContext();
        const result = await invokeResolver(
            "Query",
            "checkDuplicateUrl",
            { url: "https://example.com", excludeItemId: "item-42" },
            ctx,
        );

        expect(result.isDuplicate).toBe(false);
        expect(result.conflictingItem).toBeNull();
        expect(mockWishlistService.checkDuplicateUrl).toHaveBeenCalledWith(
            "user-1",
            "https://example.com",
            "item-42",
        );
    });

    it("returns null conflictingItem when no duplicate found", async () => {
        mockWishlistService.checkDuplicateUrl.mockResolvedValueOnce({
            isDuplicate: false,
            conflictingItem: null,
        });

        const ctx = createAuthenticatedContext();
        const result = await invokeResolver(
            "Query",
            "checkDuplicateUrl",
            { url: "https://example.com" },
            ctx,
        );

        expect(result.isDuplicate).toBe(false);
        expect(result.conflictingItem).toBeNull();
    });

    it("throws INTERNAL_SERVER_ERROR and logs redacted URL when service fails", async () => {
        const consoleErrorSpy = vi
            .spyOn(console, "error")
            .mockImplementation(() => {});
        mockWishlistService.checkDuplicateUrl.mockRejectedValueOnce(
            new Error("DB down"),
        );

        const ctx = createAuthenticatedContext();
        await expect(
            invokeResolver(
                "Query",
                "checkDuplicateUrl",
                {
                    url: "https://example.com/item?token=secret123",
                    excludeItemId: undefined,
                },
                ctx,
            ),
        ).rejects.toThrow("Failed to check for duplicate URL");

        // Verify the URL was redacted — origin + pathname only, no query params
        expect(consoleErrorSpy).toHaveBeenCalledWith(
            "[resolver] checkDuplicateUrl failed",
            expect.objectContaining({
                urlOrigin: "https://example.com/item",
            }),
        );
        expect(consoleErrorSpy).toHaveBeenCalledWith(
            expect.anything(),
            expect.not.objectContaining({
                url: expect.anything(),
            }),
        );
        consoleErrorSpy.mockRestore();
    });

    it("logs [invalid-url] when the URL cannot be parsed during error redaction", async () => {
        const consoleErrorSpy = vi
            .spyOn(console, "error")
            .mockImplementation(() => {});
        mockWishlistService.checkDuplicateUrl.mockRejectedValueOnce(
            new Error("DB down"),
        );

        const ctx = createAuthenticatedContext();
        await expect(
            invokeResolver(
                "Query",
                "checkDuplicateUrl",
                { url: "not-a-valid-url" },
                ctx,
            ),
        ).rejects.toThrow("Failed to check for duplicate URL");

        expect(consoleErrorSpy).toHaveBeenCalledWith(
            "[resolver] checkDuplicateUrl failed",
            expect.objectContaining({ urlOrigin: "[invalid-url]" }),
        );
        consoleErrorSpy.mockRestore();
    });

    it("lazy-loads links for conflicting items returned by duplicate checks", async () => {
        mockWishlistService.checkDuplicateUrl.mockResolvedValueOnce({
            isDuplicate: true,
            conflictingItem: dbItem,
        });
        mockWishlistService.getItemLinks.mockResolvedValueOnce([dbLink]);

        const ctx = createAuthenticatedContext();
        const result = await invokeResolver(
            "Query",
            "checkDuplicateUrl",
            { url: "https://example.com" },
            ctx,
        );
        const links = await invokeResolver(
            "WishlistItem",
            "links",
            {},
            ctx,
            result.conflictingItem,
        );

        expect(links).toEqual([
            expect.objectContaining({
                id: "link-1",
                itemId: "item-1",
            }),
        ]);
        expect(mockWishlistService.getItemLinks).toHaveBeenCalledWith(
            "user-1",
            "item-1",
        );
    });
});

// ---------------------------------------------------------------------------
// Query.recentItems
// ---------------------------------------------------------------------------
describe("Query.recentItems", () => {
    beforeEach(() => vi.clearAllMocks());

    it("throws UNAUTHENTICATED when not logged in", async () => {
        await expect(
            invokeResolver(
                "Query",
                "recentItems",
                { limit: 5 },
                createContext(),
            ),
        ).rejects.toThrow("Not authenticated");
    });

    it("returns recent items with links from service", async () => {
        const recentItems = [{ ...dbItem, links: [dbLink] }];

        mockWishlistService.getRecentItems.mockResolvedValueOnce(recentItems);

        const ctx = createAuthenticatedContext();
        const result = await invokeResolver(
            "Query",
            "recentItems",
            { limit: 5 },
            ctx,
        );

        expect(result).toHaveLength(1);
        expect(result[0]).toMatchObject({ id: "item-1" });
        expect(mockWishlistService.getRecentItems).toHaveBeenCalledWith(
            "user-1",
            5,
        );
    });

    it("defaults limit to 5 when not provided", async () => {
        mockWishlistService.getRecentItems.mockResolvedValueOnce([]);

        const ctx = createAuthenticatedContext();
        await invokeResolver("Query", "recentItems", {}, ctx);

        expect(mockWishlistService.getRecentItems).toHaveBeenCalledWith(
            "user-1",
            5,
        );
    });

    it("throws INTERNAL_SERVER_ERROR when service throws", async () => {
        mockWishlistService.getRecentItems.mockRejectedValueOnce(
            new Error("DB timeout"),
        );
        const ctx = createAuthenticatedContext();
        await expect(
            invokeResolver("Query", "recentItems", { limit: 5 }, ctx),
        ).rejects.toMatchObject({
            extensions: { code: "INTERNAL_SERVER_ERROR" },
        });
    });
});

// ---------------------------------------------------------------------------
// Mutation.createItem additional input fields
// ---------------------------------------------------------------------------
describe("Mutation.createItem additional input fields", () => {
    beforeEach(() => vi.clearAllMocks());

    it("passes description, favicon, status, and priority to service", async () => {
        const createdItem = {
            ...dbItem,
            description: "A nice thing",
            favicon: "https://example.com/icon.png",
            status: "purchased" as const,
            priority: 3,
        };
        mockWishlistService.createItem.mockResolvedValueOnce(createdItem);

        const ctx = createAuthenticatedContext();
        const result = await invokeResolver(
            "Mutation",
            "createItem",
            {
                input: {
                    title: "My Item",
                    description: "A nice thing",
                    favicon: "https://example.com/icon.png",
                    status: "PURCHASED",
                    priority: 3,
                    categoryId: "cat-1",
                },
            },
            ctx,
        );

        expect(mockWishlistService.createItem).toHaveBeenCalledWith(
            expect.objectContaining({
                description: "A nice thing",
                favicon: "https://example.com/icon.png",
                status: "purchased",
                priority: 3,
            }),
        );
        expect(result).toMatchObject({
            description: "A nice thing",
            favicon: "https://example.com/icon.png",
        });
    });

    it("passes linkDescription when creating item with URL", async () => {
        const item = { ...dbItem };
        const link = { ...dbLink, description: "My link description" };
        mockWishlistService.createItemWithPrimaryLink.mockResolvedValueOnce({
            item,
            link,
        });

        const ctx = createAuthenticatedContext();
        const result = await invokeResolver(
            "Mutation",
            "createItem",
            {
                input: {
                    title: "My Item",
                    url: "https://example.com",
                    linkDescription: "My link description",
                },
            },
            ctx,
        );

        expect(
            mockWishlistService.createItemWithPrimaryLink,
        ).toHaveBeenCalledWith(
            expect.anything(),
            expect.objectContaining({
                description: "My link description",
            }),
        );
    });

    it("defaults status to 'want' when not provided", async () => {
        mockWishlistService.createItem.mockResolvedValueOnce(dbItem);

        const ctx = createAuthenticatedContext();
        await invokeResolver(
            "Mutation",
            "createItem",
            {
                input: { title: "My Item" },
            },
            ctx,
        );

        expect(mockWishlistService.createItem).toHaveBeenCalledWith(
            expect.objectContaining({ status: "want" }),
        );
    });

    it("lowercases status value", async () => {
        mockWishlistService.createItem.mockResolvedValueOnce(dbItem);

        const ctx = createAuthenticatedContext();
        await invokeResolver(
            "Mutation",
            "createItem",
            {
                input: { title: "My Item", status: "ARCHIVED" },
            },
            ctx,
        );

        expect(mockWishlistService.createItem).toHaveBeenCalledWith(
            expect.objectContaining({ status: "archived" }),
        );
    });
});

// ---------------------------------------------------------------------------
// Mutation.updateItem additional input fields
// ---------------------------------------------------------------------------
describe("Mutation.updateItem additional input fields", () => {
    beforeEach(() => vi.clearAllMocks());

    it("passes favicon, status, and priority to service", async () => {
        mockWishlistService.updateItem.mockResolvedValueOnce({
            ...dbItem,
            favicon: "https://example.com/icon.png",
            status: "purchased" as const,
            priority: 3,
        });
        mockWishlistService.getItemLinks.mockResolvedValueOnce([dbLink]);

        const ctx = createAuthenticatedContext();
        const result = await invokeResolver(
            "Mutation",
            "updateItem",
            {
                id: "item-1",
                input: {
                    favicon: "https://example.com/icon.png",
                    status: "PURCHASED",
                    priority: 3,
                },
            },
            ctx,
        );

        expect(mockWishlistService.updateItem).toHaveBeenCalledWith(
            "item-1",
            "user-1",
            expect.objectContaining({
                favicon: "https://example.com/icon.png",
                status: "purchased",
                priority: 3,
            }),
        );
    });

    it("passes undefined priority when priority is not in input", async () => {
        mockWishlistService.updateItem.mockResolvedValueOnce(dbItem);
        mockWishlistService.getItemLinks.mockResolvedValueOnce([]);

        const ctx = createAuthenticatedContext();
        await invokeResolver(
            "Mutation",
            "updateItem",
            {
                id: "item-1",
                input: { title: "Updated" },
            },
            ctx,
        );

        expect(mockWishlistService.updateItem).toHaveBeenCalledWith(
            "item-1",
            "user-1",
            expect.objectContaining({ priority: undefined }),
        );
    });

    it("passes null priority when priority is explicitly null in input", async () => {
        mockWishlistService.updateItem.mockResolvedValueOnce(dbItem);
        mockWishlistService.getItemLinks.mockResolvedValueOnce([]);

        const ctx = createAuthenticatedContext();
        await invokeResolver(
            "Mutation",
            "updateItem",
            {
                id: "item-1",
                input: { priority: null },
            },
            ctx,
        );

        expect(mockWishlistService.updateItem).toHaveBeenCalledWith(
            "item-1",
            "user-1",
            expect.objectContaining({ priority: null }),
        );
    });

    it("lowercases status value", async () => {
        mockWishlistService.updateItem.mockResolvedValueOnce(dbItem);
        mockWishlistService.getItemLinks.mockResolvedValueOnce([]);

        const ctx = createAuthenticatedContext();
        await invokeResolver(
            "Mutation",
            "updateItem",
            {
                id: "item-1",
                input: { status: "ARCHIVED" },
            },
            ctx,
        );

        expect(mockWishlistService.updateItem).toHaveBeenCalledWith(
            "item-1",
            "user-1",
            expect.objectContaining({ status: "archived" }),
        );
    });

    it("throws BAD_USER_INPUT when priority is below 1 (0)", async () => {
        const ctx = createAuthenticatedContext();
        await expect(
            invokeResolver(
                "Mutation",
                "updateItem",
                { id: "item-1", input: { priority: 0 } },
                ctx,
            ),
        ).rejects.toMatchObject({ extensions: { code: "BAD_USER_INPUT" } });
        expect(mockWishlistService.updateItem).not.toHaveBeenCalled();
    });

    it("throws BAD_USER_INPUT when priority is above 5 (6)", async () => {
        const ctx = createAuthenticatedContext();
        await expect(
            invokeResolver(
                "Mutation",
                "updateItem",
                { id: "item-1", input: { priority: 6 } },
                ctx,
            ),
        ).rejects.toMatchObject({ extensions: { code: "BAD_USER_INPUT" } });
        expect(mockWishlistService.updateItem).not.toHaveBeenCalled();
    });
});

// ---------------------------------------------------------------------------
// Mutation.createItem priority validation
// ---------------------------------------------------------------------------
describe("Mutation.createItem priority validation", () => {
    beforeEach(() => vi.clearAllMocks());

    it("throws BAD_USER_INPUT when priority is below 1 (0)", async () => {
        const ctx = createAuthenticatedContext();
        await expect(
            invokeResolver(
                "Mutation",
                "createItem",
                { input: { title: "My Item", priority: 0 } },
                ctx,
            ),
        ).rejects.toMatchObject({ extensions: { code: "BAD_USER_INPUT" } });
        expect(mockWishlistService.createItem).not.toHaveBeenCalled();
    });

    it("throws BAD_USER_INPUT when priority is above 5 (6)", async () => {
        const ctx = createAuthenticatedContext();
        await expect(
            invokeResolver(
                "Mutation",
                "createItem",
                { input: { title: "My Item", priority: 6 } },
                ctx,
            ),
        ).rejects.toMatchObject({ extensions: { code: "BAD_USER_INPUT" } });
        expect(mockWishlistService.createItem).not.toHaveBeenCalled();
    });
});
