import { describe, expect, it, vi } from "vitest";
import { GraphQLError } from "graphql";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { GraphQLContext } from "../../src/graphql/context";
import { resolvers } from "../../src/graphql/resolvers";
import type { DB } from "../../src/lib/db";

function createContext(
    authOverrides: Partial<{
        signInWithPassword: ReturnType<typeof vi.fn>;
        signUp: ReturnType<typeof vi.fn>;
        signOut: ReturnType<typeof vi.fn>;
    }> = {},
): GraphQLContext {
    return {
        db: {} as DB,
        user: null,
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

async function invokeLogin(context: GraphQLContext) {
    const loginResolver = resolvers.Mutation?.login;
    if (!loginResolver) {
        throw new Error("Login resolver is unavailable");
    }

    return loginResolver(
        {},
        { input: { email: "test@example.com", password: "password123" } },
        context,
        {} as never,
    );
}

async function invokeRegister(context: GraphQLContext) {
    const registerResolver = resolvers.Mutation?.register;
    if (!registerResolver) {
        throw new Error("Register resolver is unavailable");
    }

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
});

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
});
