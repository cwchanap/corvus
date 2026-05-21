import { beforeEach, describe, expect, it, vi } from "vitest";
import type { GoogleIdentity } from "../../src/lib/auth/store";

vi.mock("../../src/lib/db/migrations", () => ({
    createDefaultCategories: vi.fn().mockResolvedValue(undefined),
}));

import { createD1AuthStore } from "../../src/lib/auth/store";
import { createDefaultCategories } from "../../src/lib/db/migrations";

function createMockDb() {
    const insertChain: Record<string, any> = {};
    insertChain.values = vi.fn().mockReturnValue(insertChain);
    insertChain.onConflictDoUpdate = vi.fn().mockReturnValue(insertChain);
    insertChain.returning = vi.fn().mockResolvedValue([]);
    insertChain.run = vi.fn().mockResolvedValue(undefined);

    const selectChain: Record<string, any> = {};
    selectChain.from = vi.fn().mockReturnValue(selectChain);
    selectChain.innerJoin = vi.fn().mockReturnValue(selectChain);
    selectChain.where = vi.fn().mockReturnValue(selectChain);
    selectChain.get = vi.fn().mockResolvedValue(null);

    const deleteChain: Record<string, any> = {};
    deleteChain.where = vi.fn().mockReturnValue(deleteChain);
    deleteChain.run = vi.fn().mockResolvedValue(undefined);

    return {
        insert: vi.fn().mockReturnValue(insertChain),
        select: vi.fn().mockReturnValue(selectChain),
        delete: vi.fn().mockReturnValue(deleteChain),
        insertChain,
        selectChain,
        deleteChain,
    };
}

const mockCreateDefaultCategories = createDefaultCategories as ReturnType<
    typeof vi.fn
>;

describe("D1AuthStore", () => {
    beforeEach(() => {
        vi.restoreAllMocks();
        mockCreateDefaultCategories.mockResolvedValue(undefined);
    });

    describe("upsertGoogleUser", () => {
        it("creates a new user and initializes default categories", async () => {
            const db = createMockDb();

            db.insertChain.returning.mockImplementation(async () => {
                const values = db.insertChain.values.mock.calls[0][0] as Record<
                    string,
                    string
                >;
                return [
                    {
                        id: values.id,
                        email: values.email,
                        name: values.name,
                        created_at: values.created_at,
                        updated_at: values.updated_at,
                    },
                ];
            });

            const store = createD1AuthStore(db as any);
            const result = await store.upsertGoogleUser({
                sub: "google-sub-1",
                email: "test@example.com",
                name: "Test User",
                picture: "https://example.com/avatar.png",
            });

            expect(result.email).toBe("test@example.com");
            expect(result.name).toBe("Test User");
            expect(mockCreateDefaultCategories).toHaveBeenCalledTimes(1);
        });

        it("updates an existing user without creating default categories", async () => {
            const db = createMockDb();

            db.insertChain.returning.mockResolvedValue([
                {
                    id: "existing-user-id",
                    email: "updated@example.com",
                    name: "Updated User",
                    created_at: "2026-01-01T00:00:00.000Z",
                    updated_at: "2026-05-20T12:00:00.000Z",
                },
            ]);

            const store = createD1AuthStore(db as any);
            const result = await store.upsertGoogleUser({
                sub: "google-sub-1",
                email: "updated@example.com",
                name: "Updated User",
                picture: null,
            });

            expect(result.id).toBe("existing-user-id");
            expect(mockCreateDefaultCategories).not.toHaveBeenCalled();
        });
    });

    describe("createSession", () => {
        it("inserts a session and returns the session id", async () => {
            const db = createMockDb();
            const store = createD1AuthStore(db as any);
            const expiresAt = new Date("2026-06-20T12:00:00.000Z");

            const result = await store.createSession("user-1", expiresAt);

            expect(typeof result).toBe("string");
            expect(result.length).toBeGreaterThan(0);
            expect(db.insert).toHaveBeenCalled();
            expect(db.insertChain.values).toHaveBeenCalledWith(
                expect.objectContaining({
                    user_id: "user-1",
                    expires_at: expiresAt.toISOString(),
                }),
            );
            expect(db.insertChain.run).toHaveBeenCalled();
        });
    });

    describe("getUserBySessionId", () => {
        it("returns the user when session is valid", async () => {
            const db = createMockDb();
            db.selectChain.get.mockResolvedValue({
                session: {
                    id: "s-1",
                    user_id: "u-1",
                    expires_at: new Date(Date.now() + 3600000).toISOString(),
                },
                user: {
                    id: "u-1",
                    email: "test@example.com",
                    name: "Test User",
                    created_at: "2026-01-01T00:00:00.000Z",
                    updated_at: "2026-05-20T12:00:00.000Z",
                },
            });

            const store = createD1AuthStore(db as any);
            const result = await store.getUserBySessionId("s-1");

            expect(result).toEqual({
                id: "u-1",
                email: "test@example.com",
                name: "Test User",
                created_at: "2026-01-01T00:00:00.000Z",
                updated_at: "2026-05-20T12:00:00.000Z",
            });
        });

        it("returns null when session is not found", async () => {
            const db = createMockDb();
            db.selectChain.get.mockResolvedValue(null);

            const store = createD1AuthStore(db as any);
            const result = await store.getUserBySessionId("nonexistent");

            expect(result).toBeNull();
        });

        it("deletes and returns null when session is expired", async () => {
            const db = createMockDb();
            db.selectChain.get.mockResolvedValue({
                session: {
                    id: "s-1",
                    user_id: "u-1",
                    expires_at: new Date(Date.now() - 3600000).toISOString(),
                },
                user: {
                    id: "u-1",
                    email: "test@example.com",
                    name: "Test User",
                    created_at: "2026-01-01T00:00:00.000Z",
                    updated_at: "2026-05-20T12:00:00.000Z",
                },
            });

            const store = createD1AuthStore(db as any);
            const result = await store.getUserBySessionId("s-1");

            expect(result).toBeNull();
            expect(db.delete).toHaveBeenCalled();
        });

        it("uses a custom now parameter for expiry check", async () => {
            const db = createMockDb();
            const expiresAt = new Date(Date.now() + 3600000).toISOString();
            db.selectChain.get.mockResolvedValue({
                session: {
                    id: "s-1",
                    user_id: "u-1",
                    expires_at: expiresAt,
                },
                user: {
                    id: "u-1",
                    email: "test@example.com",
                    name: "Test User",
                    created_at: "2026-01-01T00:00:00.000Z",
                    updated_at: "2026-05-20T12:00:00.000Z",
                },
            });

            const store = createD1AuthStore(db as any);
            const futureNow = new Date(Date.now() + 7200000);
            const result = await store.getUserBySessionId("s-1", futureNow);

            expect(result).toBeNull();
        });
    });

    describe("deleteSession", () => {
        it("deletes a session by id", async () => {
            const db = createMockDb();
            const store = createD1AuthStore(db as any);
            await store.deleteSession("session-to-delete");

            expect(db.delete).toHaveBeenCalled();
            expect(db.deleteChain.where).toHaveBeenCalled();
            expect(db.deleteChain.run).toHaveBeenCalled();
        });
    });
});
