import { Hono } from "hono";
import { createDatabase } from "../../lib/db.js";
import { AuthService } from "../../lib/auth/service.js";
import {
  getSessionCookie,
  clearSessionCookie,
} from "../../lib/auth/session.js";
import { getD1 } from "../../lib/cloudflare.js";

const app = new Hono();

app.get("/logout", async (c) => {
  try {
    const sessionId = getSessionCookie(c);

    if (sessionId) {
      const db = createDatabase(getD1(c));
      const authService = new AuthService(db);

      await authService.deleteSession(sessionId);
    }

    clearSessionCookie(c);
    return c.redirect("/");
  } catch {
    // On any error, still clear cookie to avoid broken state
    clearSessionCookie(c);
    return c.redirect("/");
  }
});

export default app;

// Enable HMR
if (import.meta.hot) {
  import.meta.hot.accept();
}
