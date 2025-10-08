import { Hono } from "hono";
import { createDatabase } from "../../../lib/db.js";
import { AuthService } from "../../../lib/auth/service.js";
import { WishlistService } from "../../../lib/wishlist/service.js";
import { getSessionCookie } from "../../../lib/auth/session.js";
import { getD1 } from "../../../lib/cloudflare.js";
import type { WishlistCategoryUpdate } from "../../../lib/db/types.js";

const app = new Hono();

app.post("/", async (c) => {
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

    const { name, color } = await c.req.json<{
      name?: string;
      color?: string;
    }>();

    if (!name?.trim()) {
      return c.json({ error: "Name is required" }, { status: 400 });
    }

    const wishlistService = new WishlistService(db);
    const category = await wishlistService.createCategory({
      user_id: user.id,
      name: name.trim(),
      color,
    });

    return c.json(category, { status: 201 });
  } catch (error) {
    console.error("Create category error:", error);
    return c.json({ error: "Failed to create category" }, { status: 500 });
  }
});

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

    await wishlistService.deleteCategory(id, user.id);

    return c.json({ success: true });
  } catch (error) {
    console.error("Delete category error:", error);
    if (error instanceof Error) {
      const message = error.message;
      if (
        message.includes("Cannot delete the last category") ||
        message.includes("No fallback category")
      ) {
        return c.json({ error: message }, { status: 400 });
      }
    }

    return c.json({ error: "Failed to delete category" }, { status: 500 });
  }
});

app.patch("/:id", async (c) => {
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
    const payload = (await c.req.json()) as WishlistCategoryUpdate;
    const updates: WishlistCategoryUpdate = {};

    if (typeof payload.name === "string") {
      const trimmed = payload.name.trim();
      if (!trimmed) {
        return c.json({ error: "Name cannot be empty" }, { status: 400 });
      }
      updates.name = trimmed;
    }

    if (typeof payload.color === "string") {
      updates.color = payload.color;
    }

    if (Object.keys(updates).length === 0) {
      return c.json({ error: "No valid fields to update" }, { status: 400 });
    }

    const wishlistService = new WishlistService(db);
    const category = await wishlistService.updateCategory(id, user.id, updates);

    if (!category) {
      return c.json({ error: "Category not found" }, { status: 404 });
    }

    return c.json(category);
  } catch (error) {
    console.error("Update category error:", error);
    return c.json({ error: "Failed to update category" }, { status: 500 });
  }
});

export default app;

// Enable HMR
if (import.meta.hot) {
  import.meta.hot.accept();
}
