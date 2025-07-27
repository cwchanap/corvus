import type { Kysely } from "kysely";
import type { Database, User, NewUser } from "../db/types";
import { hashPassword, verifyPassword, generateSessionId } from "./crypto";

export class AuthService {
  constructor(private db: Kysely<Database>) {}

  async register(email: string, password: string, name: string): Promise<User> {
    // Check if user already exists
    const existingUser = await this.db
      .selectFrom("users")
      .select(["id"])
      .where("email", "=", email)
      .executeTakeFirst();

    if (existingUser) {
      throw new Error("User already exists");
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const newUser: NewUser = {
      email,
      password_hash: passwordHash,
      name,
    };

    const user = await this.db
      .insertInto("users")
      .values(newUser)
      .returning(["id", "email", "name", "created_at", "updated_at"])
      .executeTakeFirstOrThrow();

    return user;
  }

  async login(email: string, password: string): Promise<User | null> {
    // Find user by email
    const user = await this.db
      .selectFrom("users")
      .selectAll()
      .where("email", "=", email)
      .executeTakeFirst();

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
    return userWithoutPassword as User;
  }

  async createSession(userId: number): Promise<string> {
    const sessionId = generateSessionId();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await this.db
      .insertInto("sessions")
      .values({
        id: sessionId,
        user_id: userId,
        expires_at: expiresAt.toISOString(),
      })
      .execute();

    return sessionId;
  }

  async validateSession(sessionId: string): Promise<User | null> {
    const session = await this.db
      .selectFrom("sessions")
      .innerJoin("users", "users.id", "sessions.user_id")
      .select([
        "users.id",
        "users.email",
        "users.name",
        "users.created_at",
        "users.updated_at",
        "sessions.expires_at",
      ])
      .where("sessions.id", "=", sessionId)
      .where("sessions.expires_at", ">", new Date().toISOString())
      .executeTakeFirst();

    if (!session) {
      return null;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { expires_at, ...user } = session;
    return user;
  }

  async deleteSession(sessionId: string): Promise<void> {
    await this.db.deleteFrom("sessions").where("id", "=", sessionId).execute();
  }

  async cleanupExpiredSessions(): Promise<void> {
    await this.db
      .deleteFrom("sessions")
      .where("expires_at", "<", new Date().toISOString())
      .execute();
  }

  async getUserById(id: number): Promise<User | null> {
    const user = await this.db
      .selectFrom("users")
      .select(["id", "email", "name", "created_at", "updated_at"])
      .where("id", "=", id)
      .executeTakeFirst();

    return user || null;
  }
}
