import { describe, it, expect, vi, beforeEach } from "vitest";
import type { DB } from "../../src/lib/db";
import { AuthService } from "../../src/lib/auth/service";
import type { User } from "../../src/lib/db/types";
import * as crypto from "../../src/lib/auth/crypto";
import * as migrations from "../../src/lib/db/migrations";

// Mock the crypto module
vi.mock("../../src/lib/auth/crypto", () => ({
    hashPassword: vi.fn(),
    verifyPassword: vi.fn(),
    generateSessionId: vi.fn(),
}));

// Mock the migrations module
vi.mock("../../src/lib/db/migrations", () => ({
    createDefaultCategories: vi.fn(),
}));

describe("AuthService", () => {
    const mockHashPassword = crypto.hashPassword as ReturnType<typeof vi.fn>;
    const mockVerifyPassword = crypto.verifyPassword as ReturnType<
        typeof vi.fn
    >;
    const mockGenerateSessionId = crypto.generateSessionId as ReturnType<
        typeof vi.fn
    >;
    const mockCreateDefaultCategories =
        migrations.createDefaultCategories as ReturnType<typeof vi.fn>;

    // Helper functions to reduce boilerplate
    const createSelectChain = (returnValue: unknown) => ({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        get: vi.fn().mockResolvedValue(returnValue),
    });

    const createSelectChainWithJoin = (returnValue: unknown) => ({
        from: vi.fn().mockReturnThis(),
        innerJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        get: vi.fn().mockResolvedValue(returnValue),
    });

    const createInsertChain = (returnValue: unknown) => ({
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockReturnThis(),
        get: vi.fn().mockResolvedValue(returnValue),
    });

    const createInsertRunChain = () => ({
        values: vi.fn().mockReturnThis(),
        run: vi.fn().mockResolvedValue(undefined),
    });

    const createDeleteChain = () => ({
        where: vi.fn().mockReturnThis(),
        run: vi.fn().mockResolvedValue(undefined),
    });

    beforeEach(() => {
        vi.clearAllMocks();
        mockHashPassword.mockResolvedValue("hashed-password");
        mockVerifyPassword.mockResolvedValue(true);
        mockGenerateSessionId.mockReturnValue("session-id-123");
        mockCreateDefaultCategories.mockResolvedValue(undefined);
    });

    describe("register", () => {
        it("creates a new user with hashed password", async () => {
            const mockUser = {
                id: 1,
                email: "test@example.com",
                name: "Test User",
                created_at: "2024-01-01T00:00:00.000Z",
                updated_at: "2024-01-01T00:00:00.000Z",
            };

            const selectChain = createSelectChain(null); // No existing user
            const insertChain = createInsertChain(mockUser);

            const mockDb = {
                select: vi.fn(() => selectChain),
                insert: vi.fn(() => insertChain),
            } as unknown as DB;

            const service = new AuthService(mockDb);
            const result = await service.register(
                "test@example.com",
                "password123",
                "Test User",
            );

            expect(mockHashPassword).toHaveBeenCalledWith("password123");
            expect(mockDb.select).toHaveBeenCalled();
            expect(mockDb.insert).toHaveBeenCalled();
            expect(insertChain.values).toHaveBeenCalledWith({
                email: "test@example.com",
                password_hash: "hashed-password",
                name: "Test User",
            });
            expect(mockCreateDefaultCategories).toHaveBeenCalledWith(mockDb, 1);
            expect(result).toEqual({
                id: 1,
                email: "test@example.com",
                name: "Test User",
                created_at: "2024-01-01T00:00:00.000Z",
                updated_at: "2024-01-01T00:00:00.000Z",
            });
        });

        it("throws error when user already exists", async () => {
            const selectChain = createSelectChain({ id: 1 }); // Existing user

            const mockDb = {
                select: vi.fn(() => selectChain),
            } as unknown as DB;

            const service = new AuthService(mockDb);

            await expect(
                service.register(
                    "existing@example.com",
                    "password123",
                    "Existing User",
                ),
            ).rejects.toThrow("User already exists");

            expect(mockHashPassword).not.toHaveBeenCalled();
            expect(mockCreateDefaultCategories).not.toHaveBeenCalled();
        });
    });

    describe("login", () => {
        it("returns user on successful authentication", async () => {
            const mockUser: User = {
                id: 1,
                email: "test@example.com",
                name: "Test User",
                password_hash: "hashed-password",
                created_at: "2024-01-01T00:00:00.000Z",
                updated_at: "2024-01-01T00:00:00.000Z",
            };

            const selectChain = createSelectChain(mockUser);

            const mockDb = {
                select: vi.fn(() => selectChain),
            } as unknown as DB;

            const service = new AuthService(mockDb);
            const result = await service.login(
                "test@example.com",
                "password123",
            );

            expect(mockVerifyPassword).toHaveBeenCalledWith(
                "password123",
                "hashed-password",
            );
            expect(result).toEqual({
                id: 1,
                email: "test@example.com",
                name: "Test User",
                created_at: "2024-01-01T00:00:00.000Z",
                updated_at: "2024-01-01T00:00:00.000Z",
            });
            expect(result).not.toHaveProperty("password_hash");
        });

        it("returns null when user does not exist", async () => {
            const selectChain = createSelectChain(null);

            const mockDb = {
                select: vi.fn(() => selectChain),
            } as unknown as DB;

            const service = new AuthService(mockDb);
            const result = await service.login(
                "nonexistent@example.com",
                "password",
            );

            expect(result).toBeNull();
            expect(mockVerifyPassword).not.toHaveBeenCalled();
        });

        it("returns null when password is incorrect", async () => {
            const mockUser: User = {
                id: 1,
                email: "test@example.com",
                name: "Test User",
                password_hash: "hashed-password",
                created_at: "2024-01-01T00:00:00.000Z",
                updated_at: "2024-01-01T00:00:00.000Z",
            };

            const selectChain = createSelectChain(mockUser);

            const mockDb = {
                select: vi.fn(() => selectChain),
            } as unknown as DB;

            mockVerifyPassword.mockResolvedValue(false);

            const service = new AuthService(mockDb);
            const result = await service.login(
                "test@example.com",
                "wrongpassword",
            );

            expect(mockVerifyPassword).toHaveBeenCalledWith(
                "wrongpassword",
                "hashed-password",
            );
            expect(result).toBeNull();
        });
    });

    describe("createSession", () => {
        it("creates a session with 7-day expiry", async () => {
            // Use fake timers for deterministic time-based testing
            vi.useFakeTimers();
            const mockDate = new Date("2024-01-01T00:00:00.000Z");
            vi.setSystemTime(mockDate);

            const insertChain = createInsertRunChain();

            const mockDb = {
                insert: vi.fn(() => insertChain),
            } as unknown as DB;

            const service = new AuthService(mockDb);
            const result = await service.createSession(42);

            expect(mockGenerateSessionId).toHaveBeenCalled();
            expect(result).toBe("session-id-123");

            // Calculate expected expiry (7 days from mock date)
            const expectedExpiry = new Date("2024-01-08T00:00:00.000Z");

            expect(insertChain.values).toHaveBeenCalledWith({
                id: "session-id-123",
                user_id: 42,
                expires_at: expectedExpiry.toISOString(),
                created_at: mockDate.toISOString(),
            });

            vi.useRealTimers();
        });
    });

    describe("validateSession", () => {
        it("returns user for valid non-expired session", async () => {
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + 3);

            const mockSession = {
                id: 1,
                email: "test@example.com",
                name: "Test User",
                created_at: "2024-01-01T00:00:00.000Z",
                updated_at: "2024-01-01T00:00:00.000Z",
                expires_at: futureDate.toISOString(),
            };

            const selectChain = createSelectChainWithJoin(mockSession);

            const mockDb = {
                select: vi.fn(() => selectChain),
            } as unknown as DB;

            const service = new AuthService(mockDb);
            const result = await service.validateSession("session-id-123");

            expect(result).toEqual({
                id: 1,
                email: "test@example.com",
                name: "Test User",
                created_at: "2024-01-01T00:00:00.000Z",
                updated_at: "2024-01-01T00:00:00.000Z",
            });
            expect(result).not.toHaveProperty("expires_at");
        });

        it("returns null for non-existent session", async () => {
            const selectChain = createSelectChainWithJoin(null);

            const mockDb = {
                select: vi.fn(() => selectChain),
            } as unknown as DB;

            const service = new AuthService(mockDb);
            const result = await service.validateSession("invalid-session");

            expect(result).toBeNull();
        });

        it("returns null for expired session", async () => {
            const pastDate = new Date();
            pastDate.setDate(pastDate.getDate() - 1);

            const selectChain = createSelectChainWithJoin(null); // Database filters out expired sessions

            const mockDb = {
                select: vi.fn(() => selectChain),
            } as unknown as DB;

            const service = new AuthService(mockDb);
            const result = await service.validateSession("expired-session");

            expect(result).toBeNull();
        });
    });

    describe("deleteSession", () => {
        it("deletes the specified session", async () => {
            const deleteChain = createDeleteChain();

            const mockDb = {
                delete: vi.fn(() => deleteChain),
            } as unknown as DB;

            const service = new AuthService(mockDb);
            await service.deleteSession("session-id-123");

            expect(mockDb.delete).toHaveBeenCalled();
            expect(deleteChain.where).toHaveBeenCalled();
            expect(deleteChain.run).toHaveBeenCalled();
        });
    });

    describe("cleanupExpiredSessions", () => {
        it("deletes sessions with expired timestamps", async () => {
            const deleteChain = createDeleteChain();

            const mockDb = {
                delete: vi.fn(() => deleteChain),
            } as unknown as DB;

            const service = new AuthService(mockDb);
            await service.cleanupExpiredSessions();

            expect(mockDb.delete).toHaveBeenCalled();
            expect(deleteChain.where).toHaveBeenCalled();
            expect(deleteChain.run).toHaveBeenCalled();
        });
    });

    describe("getUserById", () => {
        it("returns user when found", async () => {
            const mockUser = {
                id: 1,
                email: "test@example.com",
                name: "Test User",
                created_at: "2024-01-01T00:00:00.000Z",
                updated_at: "2024-01-01T00:00:00.000Z",
            };

            const selectChain = createSelectChain(mockUser);

            const mockDb = {
                select: vi.fn(() => selectChain),
            } as unknown as DB;

            const service = new AuthService(mockDb);
            const result = await service.getUserById(1);

            expect(result).toEqual(mockUser);
            expect(result).not.toHaveProperty("password_hash");
        });

        it("returns null when user not found", async () => {
            const selectChain = createSelectChain(undefined);

            const mockDb = {
                select: vi.fn(() => selectChain),
            } as unknown as DB;

            const service = new AuthService(mockDb);
            const result = await service.getUserById(999);

            expect(result).toBeNull();
        });
    });
});
