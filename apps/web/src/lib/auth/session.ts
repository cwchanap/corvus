import { getCookie, setCookie, deleteCookie } from "vinxi/http";
import { redirect } from "@solidjs/router";
import type { User } from "../db/types";

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
    secure: true,
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE,
    path: "/",
  });
}

export function clearSessionCookie(): void {
  deleteCookie(SESSION_COOKIE_NAME);
}

export function requireAuth(user: User | null): User {
  if (!user) {
    throw redirect("/login");
  }
  return user;
}
