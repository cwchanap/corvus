import {
    isAuthApiError,
    isAuthSessionMissingError,
} from "@supabase/supabase-js";
import type {
    AuthError,
    SupabaseClient,
    User as SupabaseUser,
} from "@supabase/supabase-js";
import type { PublicUser } from "../db/types";
import type { DB } from "../db";
import { createDefaultCategories } from "../db/migrations";

type AuthServiceErrorCode =
    | "ALREADY_EXISTS"
    | "RATE_LIMITED"
    | "TRANSIENT"
    | "UNCONFIRMED_ACCOUNT"
    | "REGISTRATION_SETUP_FAILED"
    | "UNKNOWN";

export class AuthServiceError extends Error {
    readonly code: AuthServiceErrorCode;
    readonly status?: number;

    constructor(
        message: string,
        options: {
            code: AuthServiceErrorCode;
            status?: number;
        },
    ) {
        super(message);
        this.name = "AuthServiceError";
        this.code = options.code;
        this.status = options.status;
    }
}

export class SupabaseAuthService {
    constructor(
        private supabase: SupabaseClient,
        private db: DB,
    ) {}

    async register(
        email: string,
        password: string,
        name: string,
    ): Promise<PublicUser> {
        const { data, error } = await this.supabase.auth.signUp({
            email,
            password,
            options: { data: { name } },
        });

        if (error) {
            if (error.message.toLowerCase().includes("already registered")) {
                throw new AuthServiceError("User already exists", {
                    code: "ALREADY_EXISTS",
                    status: 409,
                });
            }
            throw new Error(error.message);
        }

        // When email confirmation is enabled, signUp returns null user for existing emails
        // (Supabase obfuscates to prevent email enumeration). Detect via empty identities.
        if (!data.user) {
            throw new AuthServiceError(
                "Registration failed: check your email to confirm",
                {
                    code: "UNCONFIRMED_ACCOUNT",
                    status: 400,
                },
            );
        }

        if (data.user.identities?.length === 0) {
            throw new AuthServiceError("User already exists", {
                code: "ALREADY_EXISTS",
                status: 409,
            });
        }

        if (!data.session) {
            throw new AuthServiceError(
                "Please check your email to confirm your account before logging in.",
                {
                    code: "UNCONFIRMED_ACCOUNT",
                    status: 400,
                },
            );
        }

        try {
            await createDefaultCategories(this.db, data.user.id);
        } catch (dbError) {
            // CRITICAL: User created in Supabase but D1 setup failed.
            // The user exists in Supabase Auth but has no application data.
            // Recovery: createDefaultCategories is idempotent — logging in will
            // re-run the bootstrap and heal the account automatically.
            console.error(
                "Failed to create default categories for new user. Supabase user ID:",
                data.user.id,
                dbError,
            );

            try {
                await this.clearServerSession();
            } catch (sessionError) {
                console.error(
                    "Failed to clear session after registration bootstrap failed. Supabase user ID:",
                    data.user.id,
                    sessionError,
                );
                throw new AuthServiceError(
                    "Account created but setup failed, and we could not clear the new session automatically. Please clear your cookies before trying again.",
                    {
                        code: "REGISTRATION_SETUP_FAILED",
                    },
                );
            }

            throw new AuthServiceError(
                "Account created but setup failed. Please try logging in to complete your account setup.",
                {
                    code: "REGISTRATION_SETUP_FAILED",
                },
            );
        }

        return toPublicUser(data.user);
    }

    async login(email: string, password: string): Promise<PublicUser | null> {
        const { data, error } = await this.supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            const message = error.message.toLowerCase();
            if (
                message.includes("invalid login credentials") ||
                message.includes("invalid email or password")
            ) {
                return null;
            }

            throw createLoginError(error);
        }

        if (!data.user) {
            return null;
        }

        // Idempotent bootstrap: heals accounts where registration succeeded in
        // Supabase but D1 setup failed. Non-fatal: login already succeeded.
        try {
            await createDefaultCategories(this.db, data.user.id);
        } catch (dbError) {
            console.error(
                "Failed to bootstrap default categories on login. User ID:",
                data.user.id,
                dbError,
            );
        }

        return toPublicUser(data.user);
    }

    async logout(): Promise<void> {
        const { error } = await this.supabase.auth.signOut({
            scope: "local",
        });
        if (error && !isRecoverableSessionCleanupError(error)) {
            throw new Error(`Logout failed: ${error.message}`);
        }
    }

    async getUser(): Promise<PublicUser | null> {
        const {
            data: { user },
            error,
        } = await this.supabase.auth.getUser();

        if (error) {
            // AuthSessionMissingError means no session cookie — user is simply not logged in.
            if (isAuthSessionMissingError(error)) {
                return null;
            }

            if (isRecoverableInvalidSessionError(error)) {
                await this.clearServerSession();
                return null;
            }

            // Any other error is a real infrastructure or configuration problem.
            throw new Error(`Failed to validate session: ${error.message}`);
        }

        return user ? toPublicUser(user) : null;
    }

    private async clearServerSession(): Promise<void> {
        const { error } = await this.supabase.auth.signOut({ scope: "local" });
        if (error && !isRecoverableSessionCleanupError(error)) {
            throw new Error(
                `Failed to clear invalid session: ${error.message}`,
            );
        }
    }
}

function toPublicUser(user: SupabaseUser): PublicUser {
    const metadataName = user.user_metadata?.name;

    return {
        id: user.id,
        email: user.email ?? "",
        name: typeof metadataName === "string" ? metadataName : "",
        created_at: user.created_at,
        updated_at: user.updated_at ?? user.created_at,
    };
}

function createLoginError(error: AuthError): AuthServiceError {
    const status = typeof error.status === "number" ? error.status : undefined;
    const message = error.message.toLowerCase();

    if (
        status === 429 ||
        message.includes("too many requests") ||
        message.includes("rate limit")
    ) {
        return new AuthServiceError(`Login failed: ${error.message}`, {
            code: "RATE_LIMITED",
            status: status ?? 429,
        });
    }

    if (
        error.name === "AuthRetryableFetchError" ||
        (typeof status === "number" && status >= 500) ||
        message.includes("network request failed") ||
        message.includes("temporarily unavailable")
    ) {
        return new AuthServiceError(`Login failed: ${error.message}`, {
            code: "TRANSIENT",
            status,
        });
    }

    if (
        message.includes("email not confirmed") ||
        message.includes("email not verified") ||
        message.includes("confirm your email")
    ) {
        return new AuthServiceError(`Login failed: ${error.message}`, {
            code: "UNCONFIRMED_ACCOUNT",
            status: status ?? 400,
        });
    }

    return new AuthServiceError(`Login failed: ${error.message}`, {
        code: "UNKNOWN",
        status,
    });
}

function isRecoverableInvalidSessionError(error: AuthError): boolean {
    return (
        isAuthApiError(error) && (error.status === 401 || error.status === 403)
    );
}

function isRecoverableSessionCleanupError(error: AuthError): boolean {
    const status = typeof error.status === "number" ? error.status : undefined;

    return (
        isAuthSessionMissingError(error) ||
        status === 401 ||
        status === 403 ||
        status === 404
    );
}
