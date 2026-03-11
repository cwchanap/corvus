import { describe, it, expect, vi, beforeEach } from "vitest";
import type { DB } from "../../src/lib/db";
import { SupabaseAuthService } from "../../src/lib/auth/service";
import type { SupabaseClient } from "@supabase/supabase-js";
import * as migrations from "../../src/lib/db/migrations";

vi.mock("../../src/lib/db/migrations", () => ({
    createDefaultCategories: vi.fn(),
}));

const mockCreateDefaultCategories =
    migrations.createDefaultCategories as ReturnType<typeof vi.fn>;

const TEST_USER = {
    id: "user-uuid-123",
    email: "test@example.com",
    user_metadata: { name: "Test User" },
    created_at: "2024-01-01T00:00:00.000Z",
    updated_at: "2024-01-01T00:00:00.000Z",
};

function createMockSupabase(authOverrides: Record<string, unknown> = {}) {
    return {
        auth: {
            signUp: vi.fn(),
            signInWithPassword: vi.fn(),
            signOut: vi.fn(),
            getUser: vi.fn(),
            ...authOverrides,
        },
    } as unknown as SupabaseClient;
}

function createMockDb() {
    return {} as unknown as DB;
}

describe("SupabaseAuthService", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockCreateDefaultCategories.mockResolvedValue(undefined);
    });

    describe("register", () => {
        it("creates a new user and default categories", async () => {
            const mockSupabase = createMockSupabase({
                signUp: vi.fn().mockResolvedValue({
                    data: { user: TEST_USER },
                    error: null,
                }),
            });
            const mockDb = createMockDb();
            const service = new SupabaseAuthService(mockSupabase, mockDb);

            const result = await service.register(
                "test@example.com",
                "password123",
                "Test User",
            );

            expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
                email: "test@example.com",
                password: "password123",
                options: { data: { name: "Test User" } },
            });
            expect(mockCreateDefaultCategories).toHaveBeenCalledWith(
                mockDb,
                "user-uuid-123",
            );
            expect(result).toEqual({
                id: "user-uuid-123",
                email: "test@example.com",
                name: "Test User",
                created_at: "2024-01-01T00:00:00.000Z",
                updated_at: "2024-01-01T00:00:00.000Z",
            });
        });

        it("throws error when user already exists", async () => {
            const mockSupabase = createMockSupabase({
                signUp: vi.fn().mockResolvedValue({
                    data: { user: null },
                    error: { message: "User already registered" },
                }),
            });
            const service = new SupabaseAuthService(
                mockSupabase,
                createMockDb(),
            );

            await expect(
                service.register(
                    "existing@example.com",
                    "password123",
                    "Existing User",
                ),
            ).rejects.toThrow("User already exists");

            expect(mockCreateDefaultCategories).not.toHaveBeenCalled();
        });

        it("throws generic error for other registration failures", async () => {
            const mockSupabase = createMockSupabase({
                signUp: vi.fn().mockResolvedValue({
                    data: { user: null },
                    error: { message: "Signup is disabled" },
                }),
            });
            const service = new SupabaseAuthService(
                mockSupabase,
                createMockDb(),
            );

            await expect(
                service.register(
                    "test@example.com",
                    "password123",
                    "Test User",
                ),
            ).rejects.toThrow("Signup is disabled");
        });

        it("throws error when signUp returns null user (email confirmation mode)", async () => {
            const mockSupabase = createMockSupabase({
                signUp: vi.fn().mockResolvedValue({
                    data: { user: null },
                    error: null,
                }),
            });
            const service = new SupabaseAuthService(
                mockSupabase,
                createMockDb(),
            );

            await expect(
                service.register(
                    "test@example.com",
                    "password123",
                    "Test User",
                ),
            ).rejects.toThrow("Registration failed");

            expect(mockCreateDefaultCategories).not.toHaveBeenCalled();
        });

        it("throws error when existing user registers with email confirmation enabled", async () => {
            const mockSupabase = createMockSupabase({
                signUp: vi.fn().mockResolvedValue({
                    data: { user: { ...TEST_USER, identities: [] } },
                    error: null,
                }),
            });
            const service = new SupabaseAuthService(
                mockSupabase,
                createMockDb(),
            );

            await expect(
                service.register(
                    "existing@example.com",
                    "password123",
                    "Existing User",
                ),
            ).rejects.toThrow("User already exists");

            expect(mockCreateDefaultCategories).not.toHaveBeenCalled();
        });

        it("logs and rethrows when createDefaultCategories fails", async () => {
            const mockSupabase = createMockSupabase({
                signUp: vi.fn().mockResolvedValue({
                    data: { user: TEST_USER },
                    error: null,
                }),
            });
            mockCreateDefaultCategories.mockRejectedValue(
                new Error("D1 unavailable"),
            );
            const consoleSpy = vi
                .spyOn(console, "error")
                .mockImplementation(() => {});

            const service = new SupabaseAuthService(
                mockSupabase,
                createMockDb(),
            );

            await expect(
                service.register(
                    "test@example.com",
                    "password123",
                    "Test User",
                ),
            ).rejects.toThrow("D1 unavailable");

            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining("Failed to create default categories"),
                "user-uuid-123",
                expect.any(Error),
            );

            consoleSpy.mockRestore();
        });
    });

    describe("login", () => {
        it("returns PublicUser on successful authentication", async () => {
            const mockSupabase = createMockSupabase({
                signInWithPassword: vi.fn().mockResolvedValue({
                    data: { user: TEST_USER },
                    error: null,
                }),
            });
            const service = new SupabaseAuthService(
                mockSupabase,
                createMockDb(),
            );

            const result = await service.login(
                "test@example.com",
                "password123",
            );

            expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
                email: "test@example.com",
                password: "password123",
            });
            expect(result).toEqual({
                id: "user-uuid-123",
                email: "test@example.com",
                name: "Test User",
                created_at: "2024-01-01T00:00:00.000Z",
                updated_at: "2024-01-01T00:00:00.000Z",
            });
        });

        it("returns null when credentials are invalid", async () => {
            const mockSupabase = createMockSupabase({
                signInWithPassword: vi.fn().mockResolvedValue({
                    data: { user: null },
                    error: { message: "Invalid login credentials" },
                }),
            });
            const service = new SupabaseAuthService(
                mockSupabase,
                createMockDb(),
            );

            const result = await service.login(
                "test@example.com",
                "wrongpassword",
            );

            expect(result).toBeNull();
        });

        it("throws when upstream login fails for non-credential reasons", async () => {
            const mockSupabase = createMockSupabase({
                signInWithPassword: vi.fn().mockResolvedValue({
                    data: { user: null },
                    error: { message: "Too many requests" },
                }),
            });
            const service = new SupabaseAuthService(
                mockSupabase,
                createMockDb(),
            );

            await expect(
                service.login("test@example.com", "password123"),
            ).rejects.toThrow("Login failed: Too many requests");
        });
    });

    describe("logout", () => {
        it("signs out via supabase", async () => {
            const mockSupabase = createMockSupabase({
                signOut: vi.fn().mockResolvedValue({ error: null }),
            });
            const service = new SupabaseAuthService(
                mockSupabase,
                createMockDb(),
            );

            await service.logout();

            expect(mockSupabase.auth.signOut).toHaveBeenCalled();
        });

        it("throws when supabase sign out fails", async () => {
            const mockSupabase = createMockSupabase({
                signOut: vi.fn().mockResolvedValue({
                    error: { message: "Service unavailable" },
                }),
            });
            const service = new SupabaseAuthService(
                mockSupabase,
                createMockDb(),
            );

            await expect(service.logout()).rejects.toThrow(
                "Logout failed: Service unavailable",
            );
        });
    });

    describe("getUser", () => {
        it("returns PublicUser when session is valid", async () => {
            const mockSupabase = createMockSupabase({
                getUser: vi.fn().mockResolvedValue({
                    data: { user: TEST_USER },
                    error: null,
                }),
            });
            const service = new SupabaseAuthService(
                mockSupabase,
                createMockDb(),
            );

            const result = await service.getUser();

            expect(result).toEqual({
                id: "user-uuid-123",
                email: "test@example.com",
                name: "Test User",
                created_at: "2024-01-01T00:00:00.000Z",
                updated_at: "2024-01-01T00:00:00.000Z",
            });
        });

        it("returns null when no active session exists", async () => {
            const mockSupabase = createMockSupabase({
                getUser: vi.fn().mockResolvedValue({
                    data: { user: null },
                    error: null,
                }),
            });
            const service = new SupabaseAuthService(
                mockSupabase,
                createMockDb(),
            );

            const result = await service.getUser();

            expect(result).toBeNull();
        });

        it("returns null when AuthSessionMissingError is returned (no session cookie)", async () => {
            const mockSupabase = createMockSupabase({
                getUser: vi.fn().mockResolvedValue({
                    data: { user: null },
                    error: {
                        __isAuthError: true,
                        name: "AuthSessionMissingError",
                        message: "Auth session missing!",
                    },
                }),
            });
            const service = new SupabaseAuthService(
                mockSupabase,
                createMockDb(),
            );

            const result = await service.getUser();

            expect(result).toBeNull();
        });

        it("throws when getUser returns a non-session error (e.g. network failure)", async () => {
            const mockSupabase = createMockSupabase({
                getUser: vi.fn().mockResolvedValue({
                    data: { user: null },
                    error: {
                        __isAuthError: true,
                        name: "AuthRetryableFetchError",
                        message: "Network request failed",
                    },
                }),
            });
            const service = new SupabaseAuthService(
                mockSupabase,
                createMockDb(),
            );

            await expect(service.getUser()).rejects.toThrow(
                "Failed to validate session: Network request failed",
            );
        });
    });
});
