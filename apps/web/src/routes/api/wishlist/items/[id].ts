import { json } from "@solidjs/router";
import { getRequestEvent } from "solid-js/web";
import { createDatabase } from "../../../../lib/db";
import { AuthService } from "../../../../lib/auth/service";
import { WishlistService } from "../../../../lib/wishlist/service";
import { getSessionCookie } from "../../../../lib/auth/session";

export async function DELETE({ params }: { params: { id: string } }) {
  try {
    const sessionId = getSessionCookie();

    if (!sessionId) {
      return json({ error: "Not authenticated" }, { status: 401 });
    }

    const event = getRequestEvent();
    const d1Database = event?.nativeEvent.context?.cloudflare?.env?.DB;
    const db = createDatabase(d1Database);

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

    const event = getRequestEvent();
    const d1Database = event?.nativeEvent.context?.cloudflare?.env?.DB;
    const db = createDatabase(d1Database);

    const authService = new AuthService(db);
    const user = await authService.validateSession(sessionId);

    if (!user) {
      return json({ error: "Invalid session" }, { status: 401 });
    }

    const updates = await request.json();
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
