import { describe, it, expect, vi, beforeEach } from "vitest";
import type { DB } from "../../src/lib/db";
import {
    AuthServiceError,
    SupabaseAuthService,
} from "../../src/lib/auth/service";
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
            signOut: vi.fn().mockResolvedValue({ error: null }),
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
                    data: {
                        user: TEST_USER,
                        session: { access_token: "mock-token" },
                    },
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

            let error: unknown;

            try {
                await service.register(
                    "existing@example.com",
                    "password123",
                    "Existing User",
                );
            } catch (caughtError) {
                error = caughtError;
            }

            expect(error).toBeInstanceOf(AuthServiceError);
            expect(error).toMatchObject({
                message: "User already exists",
                code: "ALREADY_EXISTS",
                status: 409,
            });

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

            let error: unknown;

            try {
                await service.register(
                    "test@example.com",
                    "password123",
                    "Test User",
                );
            } catch (caughtError) {
                error = caughtError;
            }

            expect(error).toBeInstanceOf(AuthServiceError);
            expect(error).toMatchObject({
                message: "Registration failed: check your email to confirm",
                code: "UNCONFIRMED_ACCOUNT",
                status: 400,
            });

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

            let error: unknown;

            try {
                await service.register(
                    "existing@example.com",
                    "password123",
                    "Existing User",
                );
            } catch (caughtError) {
                error = caughtError;
            }

            expect(error).toBeInstanceOf(AuthServiceError);
            expect(error).toMatchObject({
                message: "User already exists",
                code: "ALREADY_EXISTS",
                status: 409,
            });

            expect(mockCreateDefaultCategories).not.toHaveBeenCalled();
        });

        it("throws user-friendly error and logs when createDefaultCategories fails", async () => {
            const mockSupabase = createMockSupabase({
                signUp: vi.fn().mockResolvedValue({
                    data: {
                        user: TEST_USER,
                        session: { access_token: "mock-token" },
                    },
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

            let error: unknown;

            try {
                await service.register(
                    "test@example.com",
                    "password123",
                    "Test User",
                );
            } catch (caughtError) {
                error = caughtError;
            }

            expect(error).toBeInstanceOf(AuthServiceError);
            expect(error).toMatchObject({
                message:
                    "Account created but setup failed. Please try logging in to complete your account setup.",
                code: "REGISTRATION_SETUP_FAILED",
            });

            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining("Failed to create default categories"),
                "user-uuid-123",
                expect.any(Error),
            );
            expect(mockSupabase.auth.signOut).toHaveBeenCalledWith({
                scope: "local",
            });

            consoleSpy.mockRestore();
        });

        it("throws a cookie-clearance error when signup bootstrap fails and signOut cannot clear the new session", async () => {
            const consoleSpy = vi
                .spyOn(console, "error")
                .mockImplementation(() => {});
            const mockSupabase = createMockSupabase({
                signUp: vi.fn().mockResolvedValue({
                    data: {
                        user: TEST_USER,
                        session: { access_token: "mock-token" },
                    },
                    error: null,
                }),
                signOut: vi.fn().mockResolvedValue({
                    error: { message: "Supabase unavailable" },
                }),
            });
            mockCreateDefaultCategories.mockRejectedValue(
                new Error("D1 unavailable"),
            );

            const service = new SupabaseAuthService(
                mockSupabase,
                createMockDb(),
            );

            let error: unknown;

            try {
                await service.register(
                    "test@example.com",
                    "password123",
                    "Test User",
                );
            } catch (caughtError) {
                error = caughtError;
            }

            expect(error).toBeInstanceOf(AuthServiceError);
            expect(error).toMatchObject({
                message:
                    "Account created but setup failed, and we could not clear the new session automatically. Please clear your cookies before trying again.",
                code: "REGISTRATION_SETUP_FAILED",
            });

            consoleSpy.mockRestore();
        });

        it("throws when signUp succeeds but session is null without bootstrapping D1", async () => {
            const mockSupabase = createMockSupabase({
                signUp: vi.fn().mockResolvedValue({
                    data: { user: TEST_USER, session: null },
                    error: null,
                }),
            });
            const service = new SupabaseAuthService(
                mockSupabase,
                createMockDb(),
            );

            let error: unknown;

            try {
                await service.register(
                    "test@example.com",
                    "password123",
                    "Test User",
                );
            } catch (caughtError) {
                error = caughtError;
            }

            expect(error).toBeInstanceOf(AuthServiceError);
            expect(error).toMatchObject({
                message:
                    "Please check your email to confirm your account before logging in.",
                code: "UNCONFIRMED_ACCOUNT",
                status: 400,
            });
            expect(mockCreateDefaultCategories).not.toHaveBeenCalled();
        });
    });

    describe("login", () => {
        it("returns PublicUser on successful authentication and bootstraps D1", async () => {
            const mockDb = createMockDb();
            const mockSupabase = createMockSupabase({
                signInWithPassword: vi.fn().mockResolvedValue({
                    data: { user: TEST_USER },
                    error: null,
                }),
            });
            const service = new SupabaseAuthService(mockSupabase, mockDb);

            const result = await service.login(
                "test@example.com",
                "password123",
            );

            expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
                email: "test@example.com",
                password: "password123",
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

        it("heals partial registration by bootstrapping D1 on login", async () => {
            const mockDb = createMockDb();
            const mockSupabase = createMockSupabase({
                signInWithPassword: vi.fn().mockResolvedValue({
                    data: { user: TEST_USER },
                    error: null,
                }),
            });
            const service = new SupabaseAuthService(mockSupabase, mockDb);

            await service.login("test@example.com", "password123");

            // createDefaultCategories uses onConflictDoNothing, so calling it on
            // login is safe whether or not D1 was previously initialized.
            expect(mockCreateDefaultCategories).toHaveBeenCalledWith(
                mockDb,
                "user-uuid-123",
            );
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

        it("returns null when credentials are invalid (alternate Supabase error message)", async () => {
            const mockSupabase = createMockSupabase({
                signInWithPassword: vi.fn().mockResolvedValue({
                    data: { user: null },
                    error: {
                        __isAuthError: true,
                        message: "Invalid email or password",
                    },
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
                    error: { message: "Too many requests", status: 429 },
                }),
            });
            const service = new SupabaseAuthService(
                mockSupabase,
                createMockDb(),
            );

            let error: unknown;

            try {
                await service.login("test@example.com", "password123");
            } catch (caughtError) {
                error = caughtError;
            }

            expect(error).toBeInstanceOf(AuthServiceError);
            expect(error).toMatchObject({
                message: "Login failed: Too many requests",
                code: "RATE_LIMITED",
                status: 429,
            });
        });

        it("throws a typed error when email confirmation is still pending", async () => {
            const mockSupabase = createMockSupabase({
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
            const service = new SupabaseAuthService(
                mockSupabase,
                createMockDb(),
            );

            let error: unknown;

            try {
                await service.login("test@example.com", "password123");
            } catch (caughtError) {
                error = caughtError;
            }

            expect(error).toBeInstanceOf(AuthServiceError);
            expect(error).toMatchObject({
                message: "Login failed: Email not confirmed",
                code: "UNCONFIRMED_ACCOUNT",
                status: 400,
            });
        });
    });

    describe("logout", () => {
        it("signs out only the current supabase session", async () => {
            const mockSupabase = createMockSupabase({
                signOut: vi.fn().mockResolvedValue({ error: null }),
            });
            const service = new SupabaseAuthService(
                mockSupabase,
                createMockDb(),
            );

            await service.logout();

            expect(mockSupabase.auth.signOut).toHaveBeenCalledWith({
                scope: "local",
            });
        });

        it.each([401, 403, 404])(
            "treats recoverable sign-out errors (%i) as successful logout",
            async (status) => {
                const mockSupabase = createMockSupabase({
                    signOut: vi.fn().mockResolvedValue({
                        error: {
                            __isAuthError: true,
                            name: "AuthApiError",
                            message: "Session already cleared",
                            status,
                        },
                    }),
                });
                const service = new SupabaseAuthService(
                    mockSupabase,
                    createMockDb(),
                );

                await expect(service.logout()).resolves.toBeUndefined();
            },
        );

        it("throws when supabase sign out fails", async () => {
            const mockSupabase = createMockSupabase({
                signOut: vi.fn().mockResolvedValue({
                    error: { message: "Service unavailable", status: 503 },
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

        it("normalizes non-string user metadata names to an empty string", async () => {
            const mockSupabase = createMockSupabase({
                getUser: vi.fn().mockResolvedValue({
                    data: {
                        user: {
                            ...TEST_USER,
                            user_metadata: { name: { display: "Test User" } },
                        },
                    },
                    error: null,
                }),
            });
            const service = new SupabaseAuthService(
                mockSupabase,
                createMockDb(),
            );

            const result = await service.getUser();

            expect(result).toMatchObject({
                id: "user-uuid-123",
                email: "test@example.com",
                name: "",
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

        it("returns null and clears cookies when getUser reports an invalid persisted session", async () => {
            const mockSupabase = createMockSupabase({
                getUser: vi.fn().mockResolvedValue({
                    data: { user: null },
                    error: {
                        __isAuthError: true,
                        name: "AuthApiError",
                        message: "Invalid JWT",
                        status: 401,
                    },
                }),
            });
            const service = new SupabaseAuthService(
                mockSupabase,
                createMockDb(),
            );

            const result = await service.getUser();

            expect(result).toBeNull();
            expect(mockSupabase.auth.signOut).toHaveBeenCalledWith({
                scope: "local",
            });
        });

        it("returns null and logs when an invalid persisted session cannot be cleared", async () => {
            const consoleSpy = vi
                .spyOn(console, "error")
                .mockImplementation(() => {});
            const mockSupabase = createMockSupabase({
                getUser: vi.fn().mockResolvedValue({
                    data: { user: null },
                    error: {
                        __isAuthError: true,
                        name: "AuthApiError",
                        message: "Invalid JWT",
                        status: 401,
                    },
                }),
                signOut: vi.fn().mockResolvedValue({
                    error: {
                        __isAuthError: true,
                        name: "AuthUnknownError",
                        message: "Storage unavailable",
                    },
                }),
            });
            const service = new SupabaseAuthService(
                mockSupabase,
                createMockDb(),
            );

            const result = await service.getUser();

            expect(result).toBeNull();
            expect(consoleSpy).toHaveBeenCalledWith(
                "Failed to clear invalid session during getUser recovery:",
                expect.any(Error),
            );
            consoleSpy.mockRestore();
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
