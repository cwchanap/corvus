import { Hono } from "hono";
import { createDatabase } from "../../lib/db.js";
import { AuthService } from "../../lib/auth/service.js";
import { WishlistService } from "../../lib/wishlist/service.js";
import { getSessionCookie } from "../../lib/auth/session.js";
import { getD1 } from "../../lib/cloudflare.js";

const app = new Hono();

app.get("/", async (c) => {
  try {
    const sessionId = getSessionCookie(c);

    if (!sessionId) {
      return c.json({ error: "Not authenticated" }, { status: 401 });
    }

    const db = createDatabase(getD1(c));

    const authService = new AuthService(db);
    const user = await authService.validateSession(sessionId);

    if (!user) {
      return c.json({ error: "Invalid session" }, { status: 401 });
    }

    const wishlistService = new WishlistService(db);
    const wishlistData = await wishlistService.getUserWishlistData(user.id);

    return c.json(wishlistData);
  } catch (error) {
    console.error("Get wishlist error:", error);
    return c.json({ error: "Failed to get wishlist" }, { status: 500 });
  }
});

export default app;
