import { action, redirect } from "@solidjs/router";
import { setSessionCookie, clearSessionCookie } from "./session.js";

export const loginAction = action(async (formData: FormData) => {
  "use server";

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    throw new Error("Email and password are required");
  }

  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const data = (await response.json()) as { error?: string };
    throw new Error(data.error || "Login failed");
  }

  const setCookieHeader = response.headers.get("Set-Cookie");
  if (setCookieHeader) {
    const match = /sessionId=([^;]+)/.exec(setCookieHeader);
    if (match && match[1]) {
      const sessionId = match[1];
      setSessionCookie(sessionId);
    }
  }

  return { success: true } as const;
});

export const logoutAction = action(async () => {
  "use server";

  await fetch("/api/auth/logout", {
    method: "GET",
  });

  clearSessionCookie();
  throw redirect("/");
});
