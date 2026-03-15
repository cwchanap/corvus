import { describe, expect, it, vi, beforeEach } from "vitest";
import type { Context } from "hono";

// vi.mock calls are hoisted - factories must not reference module-scope variables
vi.mock("../../src/lib/cloudflare", () => ({
    getD1: vi.fn(),
}));

vi.mock("../../src/lib/db", () => ({
    createDatabase: vi.fn(),
}));

vi.mock("../../src/lib/auth/supabase-client", () => ({
    createSupabaseServerClient: vi.fn(),
}));

vi.mock("../../src/lib/auth/service", () => ({
    SupabaseAuthService: vi.fn(),
}));

import { createGraphQLContext } from "../../src/graphql/context";
import { getD1 } from "../../src/lib/cloudflare";
import { createDatabase } from "../../src/lib/db";
import { createSupabaseServerClient } from "../../src/lib/auth/supabase-client";
import { SupabaseAuthService } from "../../src/lib/auth/service";

const mockGetUser = vi.fn();
const mockDb = { db: "mock-db" };
const mockSupabase = { auth: {} };
const mockD1 = { database: "mock-d1" };
const mockRawRequest = new Request("https://api.example.com/graphql");

function createMockHonoContext(): Context {
    return {
        req: { raw: mockRawRequest },
        env: {},
    } as unknown as Context;
}

describe("createGraphQLContext", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(getD1).mockReturnValue(mockD1 as never);
        vi.mocked(createDatabase).mockReturnValue(mockDb as never);
        vi.mocked(createSupabaseServerClient).mockReturnValue(
            mockSupabase as never,
        );
        vi.mocked(SupabaseAuthService).mockImplementation(
            () => ({ getUser: mockGetUser }) as never,
        );
    });

    it("returns context with authenticated user", async () => {
        const mockUser = {
            id: "user-1",
            email: "test@example.com",
            name: "Test",
            created_at: "2024-01-01",
            updated_at: "2024-01-01",
        };
        mockGetUser.mockResolvedValue(mockUser);

        const c = createMockHonoContext();
        const ctx = await createGraphQLContext(c);

        expect(ctx.user).toEqual(mockUser);
        expect(ctx.db).toBe(mockDb);
        expect(ctx.supabase).toBe(mockSupabase);
        expect(ctx.honoContext).toBe(c);
        expect(ctx.request).toBe(mockRawRequest);
    });

    it("returns context with null user when no session", async () => {
        mockGetUser.mockResolvedValue(null);

        const ctx = await createGraphQLContext(createMockHonoContext());

        expect(ctx.user).toBeNull();
    });

    it("propagates errors from getUser", async () => {
        mockGetUser.mockRejectedValue(new Error("Token expired"));

        await expect(
            createGraphQLContext(createMockHonoContext()),
        ).rejects.toThrow("Token expired");
    });

    it("creates db using d1 binding from context", async () => {
        mockGetUser.mockResolvedValue(null);

        const c = createMockHonoContext();
        await createGraphQLContext(c);

        expect(getD1).toHaveBeenCalledWith(c);
        expect(createDatabase).toHaveBeenCalledWith(mockD1);
    });

    it("creates supabase client using hono context", async () => {
        mockGetUser.mockResolvedValue(null);

        const c = createMockHonoContext();
        await createGraphQLContext(c);

        expect(createSupabaseServerClient).toHaveBeenCalledWith(c);
    });
});
