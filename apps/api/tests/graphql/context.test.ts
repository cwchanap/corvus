import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Context } from "hono";

vi.mock("../../src/lib/cloudflare", () => ({
    getD1: vi.fn(),
}));

vi.mock("../../src/lib/db", () => ({
    createDatabase: vi.fn(),
}));

vi.mock("../../src/lib/auth/store", () => ({
    createD1AuthStore: vi.fn(),
}));

vi.mock("../../src/lib/auth/service", () => ({
    GoogleAuthService: vi.fn(),
}));

import { createGraphQLContext } from "../../src/graphql/context";
import { getD1 } from "../../src/lib/cloudflare";
import { createDatabase } from "../../src/lib/db";
import { createD1AuthStore } from "../../src/lib/auth/store";
import { GoogleAuthService } from "../../src/lib/auth/service";

const mockGetUser = vi.fn();
const mockDb = { db: "mock-db" };
const mockStore = { store: "mock-store" };
const mockD1 = { database: "mock-d1" };
const mockRawRequest = new Request("https://api.example.com/graphql");

function createMockHonoContext(cookieHeader = ""): Context {
    return {
        req: {
            raw: mockRawRequest,
            header: (name: string) =>
                name === "cookie" ? cookieHeader : undefined,
        },
        env: { GOOGLE_CLIENT_ID: "client-id" },
    } as unknown as Context;
}

describe("createGraphQLContext", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(getD1).mockReturnValue(mockD1 as never);
        vi.mocked(createDatabase).mockReturnValue(mockDb as never);
        vi.mocked(createD1AuthStore).mockReturnValue(mockStore as never);
        vi.mocked(GoogleAuthService).mockImplementation(
            () => ({ getUser: mockGetUser }) as never,
        );
    });

    it("returns context with authenticated user from Corvus session cookie", async () => {
        const mockUser = {
            id: "user-1",
            email: "test@example.com",
            name: "Test",
            created_at: "2024-01-01",
            updated_at: "2024-01-01",
        };
        mockGetUser.mockResolvedValue(mockUser);

        const c = createMockHonoContext("corvus-session=session-123");
        const ctx = await createGraphQLContext(c);

        expect(ctx.user).toEqual(mockUser);
        expect(ctx.sessionId).toBe("session-123");
        expect(ctx.db).toBe(mockDb);
        expect(ctx.honoContext).toBe(c);
        expect(ctx.request).toBe(mockRawRequest);
        expect(mockGetUser).toHaveBeenCalledWith("session-123");
    });

    it("returns context with null user when no session exists", async () => {
        mockGetUser.mockResolvedValue(null);

        const ctx = await createGraphQLContext(createMockHonoContext());

        expect(ctx.user).toBeNull();
        expect(ctx.sessionId).toBeNull();
        expect(mockGetUser).toHaveBeenCalledWith(null);
    });

    it("propagates errors from getUser", async () => {
        mockGetUser.mockRejectedValue(new Error("Session lookup failed"));

        await expect(
            createGraphQLContext(
                createMockHonoContext("corvus-session=session-123"),
            ),
        ).rejects.toThrow("Session lookup failed");
    });

    it("creates auth service using D1 store and Hono env", async () => {
        mockGetUser.mockResolvedValue(null);

        const c = createMockHonoContext();
        await createGraphQLContext(c);

        expect(getD1).toHaveBeenCalledWith(c);
        expect(createDatabase).toHaveBeenCalledWith(mockD1);
        expect(createD1AuthStore).toHaveBeenCalledWith(mockDb);
        expect(GoogleAuthService).toHaveBeenCalledWith(mockStore, c.env);
    });
});
