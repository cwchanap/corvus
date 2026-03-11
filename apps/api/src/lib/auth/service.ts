import type {
    SupabaseClient,
    User as SupabaseUser,
} from "@supabase/supabase-js";
import type { PublicUser } from "../db/types";
import type { DB } from "../db";
import { createDefaultCategories } from "../db/migrations";

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
                throw new Error("User already exists");
            }
            throw new Error(error.message);
        }

        // When email confirmation is enabled, signUp returns null user for existing emails
        // (Supabase obfuscates to prevent email enumeration). Detect via empty identities.
        if (!data.user) {
            throw new Error("Registration failed: check your email to confirm");
        }

        if (data.user.identities?.length === 0) {
            throw new Error("User already exists");
        }

        await createDefaultCategories(this.db, data.user.id);
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

            throw new Error(`Login failed: ${error.message}`);
        }

        if (!data.user) {
            return null;
        }

        return toPublicUser(data.user);
    }

    async logout(): Promise<void> {
        const { error } = await this.supabase.auth.signOut();
        if (error) {
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
            if (error.name === "AuthSessionMissingError") {
                return null;
            }
            // Any other error is a real infrastructure or configuration problem.
            throw new Error(`Failed to validate session: ${error.message}`);
        }

        return user ? toPublicUser(user) : null;
    }
}

function toPublicUser(user: SupabaseUser): PublicUser {
    return {
        id: user.id,
        email: user.email ?? "",
        name: (user.user_metadata?.name as string) ?? "",
        created_at: user.created_at,
        updated_at: user.updated_at ?? user.created_at,
    };
}
