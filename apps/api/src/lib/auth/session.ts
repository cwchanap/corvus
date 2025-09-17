import type { Context } from "hono";
import type { PublicUser } from "../db/types.js";

export interface SessionData {
  userId: number;
  sessionId: string;
}

const SESSION_COOKIE_NAME = "corvus-session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export function getSessionCookie(c?: Context): string | undefined {
  return c?.req
    .header("cookie")
    ?.split(";")
    .find((c) => c.trim().startsWith(`${SESSION_COOKIE_NAME}=`))
    ?.split("=")[1];
}

export function setSessionCookie(c: Context, sessionId: string): void {
  c.header(
    "Set-Cookie",
    `${SESSION_COOKIE_NAME}=${sessionId}; HttpOnly; Secure; SameSite=None; Max-Age=${SESSION_MAX_AGE}; Path=/`,
  );
}

export function clearSessionCookie(c: Context): void {
  // Must match the same attributes (at least path) used when setting the cookie
  c.header(
    "Set-Cookie",
    `${SESSION_COOKIE_NAME}=; HttpOnly; Secure; SameSite=None; Max-Age=0; Path=/`,
  );
}

export function requireAuth(user: PublicUser | null): PublicUser {
  if (!user) {
    throw new Error("Authentication required");
  }
  return user;
}
