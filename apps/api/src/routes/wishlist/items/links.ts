import { Hono } from "hono";
import { createDatabase } from "../../../lib/db.js";
import { AuthService } from "../../../lib/auth/service.js";
import { WishlistService } from "../../../lib/wishlist/service.js";
import { getSessionCookie } from "../../../lib/auth/session.js";
import { getD1 } from "../../../lib/cloudflare.js";

const app = new Hono();

// Get all links for an item
app.get("/:itemId", async (c) => {
  try {
    const { itemId } = c.req.param();
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
    const links = await wishlistService.getItemLinks(itemId);
    return c.json(links);
  } catch (error) {
    console.error("Get item links error:", error);
    return c.json({ error: "Failed to get item links" }, { status: 500 });
  }
});

// Create a new link for an item
app.post("/:itemId", async (c) => {
  try {
    const { itemId } = c.req.param();
    const { url, description, is_primary } = await c.req.json();

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

    if (!url) {
      return c.json({ error: "URL is required" }, { status: 400 });
    }

    const wishlistService = new WishlistService(db);
    const link = await wishlistService.createItemLink({
      item_id: itemId,
      url,
      description,
      is_primary: is_primary ?? false,
    });

    return c.json(link, { status: 201 });
  } catch (error) {
    console.error("Create item link error:", error);
    return c.json({ error: "Failed to create item link" }, { status: 500 });
  }
});

// Update a link
app.patch("/:itemId/links/:linkId", async (c) => {
  try {
    const { linkId } = c.req.param();
    const updates = await c.req.json();

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
    const link = await wishlistService.updateItemLink(linkId, updates);

    if (!link) {
      return c.json({ error: "Link not found" }, { status: 404 });
    }

    return c.json(link);
  } catch (error) {
    console.error("Update item link error:", error);
    return c.json({ error: "Failed to update item link" }, { status: 500 });
  }
});

// Set a link as primary
app.post("/:itemId/links/:linkId/primary", async (c) => {
  try {
    const { itemId, linkId } = c.req.param();

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
    await wishlistService.setPrimaryLink(itemId, linkId);
    return c.json({ success: true });
  } catch (error) {
    console.error("Set primary link error:", error);
    return c.json({ error: "Failed to set primary link" }, { status: 500 });
  }
});

// Delete a link
app.delete("/:itemId/links/:linkId", async (c) => {
  try {
    const { linkId } = c.req.param();

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
    await wishlistService.deleteItemLink(linkId);
    return c.json({ success: true });
  } catch (error) {
    console.error("Delete item link error:", error);
    return c.json({ error: "Failed to delete item link" }, { status: 500 });
  }
});

export default app;

// Enable HMR
if (import.meta.hot) {
  import.meta.hot.accept();
}
