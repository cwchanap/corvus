import { Hono } from "hono";
import { createDatabase } from "../../../lib/db.js";
import { AuthService } from "../../../lib/auth/service.js";
import { WishlistService } from "../../../lib/wishlist/service.js";
import { getSessionCookie } from "../../../lib/auth/session.js";
import { getD1 } from "../../../lib/cloudflare.js";
import type { WishlistItemUpdate } from "../../../lib/db/types.js";

const app = new Hono();

app.delete("/:id", async (c) => {
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

    const id = c.req.param("id");
    const wishlistService = new WishlistService(db);
    await wishlistService.deleteItem(id, user.id);

    return c.json({ success: true });
  } catch (error) {
    console.error("Delete item error:", error);
    return c.json({ error: "Failed to delete item" }, { status: 500 });
  }
});

app.put("/:id", async (c) => {
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

    const id = c.req.param("id");
    const updates = (await c.req.json()) as WishlistItemUpdate;
    const wishlistService = new WishlistService(db);
    const item = await wishlistService.updateItem(id, updates);

    if (!item) {
      return c.json({ error: "Item not found" }, { status: 404 });
    }

    return c.json(item);
  } catch (error) {
    console.error("Update item error:", error);
    return c.json({ error: "Failed to update item" }, { status: 500 });
  }
});

export default app;
