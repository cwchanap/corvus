import { getCookie, setCookie, deleteCookie } from "vinxi/http";
import { redirect } from "@solidjs/router";
import type { GraphQLUser } from "@repo/common/graphql/types";

export interface SessionData {
  userId: number;
  sessionId: string;
}

const SESSION_COOKIE_NAME = "corvus-session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export function getSessionCookie(): string | undefined {
  return getCookie(SESSION_COOKIE_NAME);
}

export function setSessionCookie(sessionId: string): void {
  setCookie(SESSION_COOKIE_NAME, sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE,
    path: "/",
  });
}

export function clearSessionCookie(): void {
  // Must match the same attributes (at least path) used when setting the cookie
  deleteCookie(SESSION_COOKIE_NAME, { path: "/" });
}

export function requireAuth(user: GraphQLUser | null): GraphQLUser {
  if (!user) {
    throw redirect("/login");
  }
  return user;
}
