import { eq } from "drizzle-orm";
import type { DB } from "../db";
import type { PublicUser } from "../db/types";
import { sessions, users } from "../db/schema";
import { createDefaultCategories } from "../db/migrations";

export interface GoogleIdentity {
    sub: string;
    email: string;
    name: string;
    picture?: string | null;
}

export interface AuthStore {
    upsertGoogleUser(identity: GoogleIdentity): Promise<PublicUser>;
    createSession(userId: string, expiresAt: Date): Promise<string>;
    getUserBySessionId(
        sessionId: string,
        now?: Date,
    ): Promise<PublicUser | null>;
    deleteSession(sessionId: string): Promise<void>;
}

export function createD1AuthStore(db: DB): AuthStore {
    return new D1AuthStore(db);
}

class D1AuthStore implements AuthStore {
    constructor(private readonly db: DB) {}

    async upsertGoogleUser(identity: GoogleIdentity): Promise<PublicUser> {
        const now = new Date().toISOString();
        const newId = crypto.randomUUID();

        const [row] = await this.db
            .insert(users)
            .values({
                id: newId,
                google_sub: identity.sub,
                email: identity.email,
                name: identity.name,
                avatar_url: identity.picture ?? null,
                created_at: now,
                updated_at: now,
            })
            .onConflictDoUpdate({
                target: users.google_sub,
                set: {
                    email: identity.email,
                    name: identity.name,
                    avatar_url: identity.picture ?? null,
                    updated_at: now,
                },
            })
            .returning({
                id: users.id,
                email: users.email,
                name: users.name,
                created_at: users.created_at,
                updated_at: users.updated_at,
            });

        // Always attempt to seed default categories. The function uses
        // onConflictDoNothing so it is idempotent — existing categories are
        // left untouched. This also recovers from a previous login where the
        // user insert committed but the category bootstrap failed.
        await createDefaultCategories(this.db, row.id);

        return row;
    }

    async createSession(userId: string, expiresAt: Date): Promise<string> {
        const sessionId = crypto.randomUUID();

        await this.db
            .insert(sessions)
            .values({
                id: sessionId,
                user_id: userId,
                expires_at: expiresAt.toISOString(),
            })
            .run();

        return sessionId;
    }

    async getUserBySessionId(
        sessionId: string,
        now = new Date(),
    ): Promise<PublicUser | null> {
        const row = await this.db
            .select({
                session: sessions,
                user: users,
            })
            .from(sessions)
            .innerJoin(users, eq(sessions.user_id, users.id))
            .where(eq(sessions.id, sessionId))
            .get();

        if (!row) {
            return null;
        }

        const parsed = Date.parse(row.session.expires_at);
        if (Number.isNaN(parsed) || parsed <= now.getTime()) {
            await this.deleteSession(sessionId);
            return null;
        }

        return toPublicUser(row.user);
    }

    async deleteSession(sessionId: string): Promise<void> {
        await this.db.delete(sessions).where(eq(sessions.id, sessionId)).run();
    }
}

function toPublicUser(user: {
    id: string;
    email: string;
    name: string;
    created_at: string;
    updated_at: string;
}): PublicUser {
    return {
        id: user.id,
        email: user.email,
        name: user.name,
        created_at: user.created_at,
        updated_at: user.updated_at,
    };
}
