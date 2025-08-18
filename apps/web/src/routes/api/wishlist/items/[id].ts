import { json } from "@solidjs/router";
import { createDatabase } from "../../../../lib/db.js";
import { AuthService } from "../../../../lib/auth/service.js";
import { WishlistService } from "../../../../lib/wishlist/service.js";
import { getSessionCookie } from "../../../../lib/auth/session.js";
import { getD1 } from "../../../../lib/cloudflare.js";
import type { WishlistItemUpdate } from "../../../../lib/db/types.js";

export async function DELETE({ params }: { params: { id: string } }) {
  try {
    const sessionId = getSessionCookie();

    if (!sessionId) {
      return json({ error: "Not authenticated" }, { status: 401 });
    }

    const db = createDatabase(getD1());

    const authService = new AuthService(db);
    const user = await authService.validateSession(sessionId);

    if (!user) {
      return json({ error: "Invalid session" }, { status: 401 });
    }

    const wishlistService = new WishlistService(db);
    await wishlistService.deleteItem(params.id, user.id);

    return json({ success: true });
  } catch (error) {
    console.error("Delete item error:", error);
    return json({ error: "Failed to delete item" }, { status: 500 });
  }
}

export async function PUT({
  request,
  params,
}: {
  request: Request;
  params: { id: string };
}) {
  try {
    const sessionId = getSessionCookie();

    if (!sessionId) {
      return json({ error: "Not authenticated" }, { status: 401 });
    }

    const db = createDatabase(getD1());

    const authService = new AuthService(db);
    const user = await authService.validateSession(sessionId);

    if (!user) {
      return json({ error: "Invalid session" }, { status: 401 });
    }

    const updates = (await request.json()) as WishlistItemUpdate;
    const wishlistService = new WishlistService(db);
    const item = await wishlistService.updateItem(params.id, updates);

    if (!item) {
      return json({ error: "Item not found" }, { status: 404 });
    }

    return json(item);
  } catch (error) {
    console.error("Update item error:", error);
    return json({ error: "Failed to update item" }, { status: 500 });
  }
}
