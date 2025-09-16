import { Hono } from "hono";
import { createDatabase } from "../../lib/db.js";
import { AuthService } from "../../lib/auth/service.js";
import { setSessionCookie } from "../../lib/auth/session.js";
import { getD1 } from "../../lib/cloudflare.js";

const app = new Hono();

app.post("/register", async (c) => {
  try {
    const { email, password, name } = await c.req.json();

    if (!email || !password || !name) {
      return c.json(
        { error: "Email, password, and name are required" },
        { status: 400 },
      );
    }

    const db = createDatabase(getD1(c));
    const authService = new AuthService(db);
    const user = await authService.register(email, password, name);

    // Create session and set cookie
    const sessionId = await authService.createSession(user.id);
    setSessionCookie(c, sessionId);

    return c.json({
      success: true,
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch (error) {
    console.error("Register error:", error);
    if (error instanceof Error && error.message === "User already exists") {
      return c.json({ error: "User already exists" }, { status: 409 });
    }
    return c.json({ error: "Internal server error" }, { status: 500 });
  }
});

export default app;

// Enable HMR
if (import.meta.hot) {
  import.meta.hot.accept();
}
