import { describe, expect, it, vi } from "vitest";
import { GraphQLError } from "graphql";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { GraphQLContext } from "../../src/graphql/context";
import { resolvers } from "../../src/graphql/resolvers";
import type { DB } from "../../src/lib/db";

function createContext(
    signInWithPassword: ReturnType<typeof vi.fn>,
): GraphQLContext {
    return {
        db: {} as DB,
        user: null,
        supabase: {
            auth: {
                signInWithPassword,
                signOut: vi.fn().mockResolvedValue({ error: null }),
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

describe("login resolver", () => {
    it("returns a rate-limited GraphQLError for rate-limited auth failures", async () => {
        const context = createContext(
            vi.fn().mockResolvedValue({
                data: { user: null },
                error: {
                    __isAuthError: true,
                    name: "AuthApiError",
                    message: "Too many requests",
                    status: 429,
                },
            }),
        );

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
        const context = createContext(
            vi.fn().mockResolvedValue({
                data: { user: null },
                error: {
                    __isAuthError: true,
                    name: "AuthRetryableFetchError",
                    message: "Network request failed",
                },
            }),
        );

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
});
