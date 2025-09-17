import { Hono } from "hono";
import { createDatabase } from "../../lib/db.js";
import { AuthService } from "../../lib/auth/service.js";
import { getSessionCookie } from "../../lib/auth/session.js";
import { getD1 } from "../../lib/cloudflare.js";

const app = new Hono();

app.get("/me", async (c) => {
  const sessionId = getSessionCookie(c);
  if (!sessionId) {
    return c.json({ user: null });
  }

  const db = createDatabase(getD1(c));
  const authService = new AuthService(db);
  const user = await authService.validateSession(sessionId);

  if (!user) {
    return c.json({ user: null });
  }

  return c.json({ user });
});

export default app;
