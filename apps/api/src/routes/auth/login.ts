import { Hono } from "hono";
import { createDatabase } from "../../lib/db.js";
import { AuthService } from "../../lib/auth/service.js";
import { setSessionCookie } from "../../lib/auth/session.js";
import { getD1 } from "../../lib/cloudflare.js";

const app = new Hono();

app.post("/login", async (c) => {
  try {
    const { email, password } = await c.req.json();

    if (!email || !password) {
      return c.json(
        { error: "Email and password are required" },
        { status: 400 },
      );
    }

    const db = createDatabase(getD1(c));
    const authService = new AuthService(db);
    const user = await authService.login(email, password);

    if (!user) {
      return c.json({ error: "Invalid email or password" }, { status: 401 });
    }

    // Create session and set cookie
    const sessionId = await authService.createSession(user.id);
    setSessionCookie(c, sessionId);

    return c.json({
      success: true,
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch (error) {
    console.error("Login error:", error);
    return c.json({ error: "Internal server error" }, { status: 500 });
  }
});

export default app;
