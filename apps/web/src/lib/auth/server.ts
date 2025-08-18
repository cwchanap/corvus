import { action, redirect } from "@solidjs/router";
import { createDatabase } from "../db.js";
import { AuthService } from "./service.js";
import {
  getSessionCookie,
  setSessionCookie,
  clearSessionCookie,
} from "./session.js";
import { getD1 } from "../cloudflare.js";

async function getAuthService() {
  const db = createDatabase(getD1());
  return new AuthService(db);
}

export const loginAction = action(async (formData: FormData) => {
  "use server";

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    throw new Error("Email and password are required");
  }

  const authService = await getAuthService();
  const user = await authService.login(email, password);

  if (!user) {
    throw new Error("Invalid email or password");
  }

  // Create session and set cookie
  const sessionId = await authService.createSession(user.id);
  setSessionCookie(sessionId);

  return { success: true } as const;
});

export const registerAction = action(async (formData: FormData) => {
  "use server";

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const name = formData.get("name") as string;

  if (!email || !password || !name) {
    throw new Error("All fields are required");
  }

  if (password.length < 8) {
    throw new Error("Password must be at least 8 characters long");
  }

  const authService = await getAuthService();

  try {
    const user = await authService.register(email, password, name);

    // Create session and set cookie
    const sessionId = await authService.createSession(user.id);
    setSessionCookie(sessionId);

    return { success: true } as const;
  } catch (error) {
    if (error instanceof Error && error.message === "User already exists") {
      throw new Error("An account with this email already exists");
    }
    throw error;
  }
});

export const logoutAction = action(async () => {
  "use server";

  const sessionId = getSessionCookie();
  if (sessionId) {
    const authService = await getAuthService();
    await authService.deleteSession(sessionId);
  }

  clearSessionCookie();
  throw redirect("/");
});
