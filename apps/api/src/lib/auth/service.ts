import type { PublicUser } from "../db/types";
import type { DB } from "../db";
import { users, sessions } from "../db/schema";
import { eq, and, gt, lt } from "drizzle-orm";
import { hashPassword, verifyPassword, generateSessionId } from "./crypto";
import { createDefaultCategories } from "../db/migrations";

export class AuthService {
  constructor(private db: DB) {}

  async register(
    email: string,
    password: string,
    name: string,
  ): Promise<PublicUser> {
    // Check if user already exists
    const existingUser = await this.db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .get();

    if (existingUser) {
      throw new Error("User already exists");
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const user = await this.db
      .insert(users)
      .values({ email, password_hash: passwordHash, name })
      .returning({
        id: users.id,
        email: users.email,
        name: users.name,
        created_at: users.created_at,
        updated_at: users.updated_at,
      })
      .get();

    // Create default wishlist categories for new user
    await createDefaultCategories(this.db, user.id);

    return user;
  }

  async login(email: string, password: string): Promise<PublicUser | null> {
    // Find user by email
    const user = await this.db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .get();

    if (!user) {
      return null;
    }

    // Verify password
    const isValid = await verifyPassword(password, user.password_hash);
    if (!isValid) {
      return null;
    }

    // Return user without password hash
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password_hash, ...userWithoutPassword } = user;
    return userWithoutPassword as PublicUser;
  }

  async createSession(userId: number): Promise<string> {
    const sessionId = generateSessionId();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await this.db
      .insert(sessions)
      .values({
        id: sessionId,
        user_id: userId,
        expires_at: expiresAt.toISOString(),
        created_at: new Date().toISOString(),
      })
      .run();

    return sessionId;
  }

  async validateSession(sessionId: string): Promise<PublicUser | null> {
    const session = await this.db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        created_at: users.created_at,
        updated_at: users.updated_at,
        expires_at: sessions.expires_at,
      })
      .from(sessions)
      .innerJoin(users, eq(users.id, sessions.user_id))
      .where(
        and(
          eq(sessions.id, sessionId),
          gt(sessions.expires_at, new Date().toISOString()),
        ),
      )
      .get();

    if (!session) {
      return null;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { expires_at, ...user } = session;
    return user;
  }

  async deleteSession(sessionId: string): Promise<void> {
    await this.db.delete(sessions).where(eq(sessions.id, sessionId)).run();
  }

  async cleanupExpiredSessions(): Promise<void> {
    await this.db
      .delete(sessions)
      .where(lt(sessions.expires_at, new Date().toISOString()))
      .run();
  }

  async getUserById(id: number): Promise<PublicUser | null> {
    const user = await this.db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        created_at: users.created_at,
        updated_at: users.updated_at,
      })
      .from(users)
      .where(eq(users.id, id))
      .get();

    return user || null;
  }
}
