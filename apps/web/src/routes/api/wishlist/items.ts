import { json } from "@solidjs/router";
import { getRequestEvent } from "solid-js/web";
import { createDatabase } from "../../../lib/db";
import { AuthService } from "../../../lib/auth/service";
import { WishlistService } from "../../../lib/wishlist/service";
import { getSessionCookie } from "../../../lib/auth/session";

export async function POST({ request }: { request: Request }) {
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

    const { title, url, description, category_id } = await request.json();

    if (!title || !url || !category_id) {
      return json(
        { error: "Title, URL, and category are required" },
        { status: 400 },
      );
    }

    const wishlistService = new WishlistService(db);
    const item = await wishlistService.createItem({
      user_id: user.id,
      category_id,
      title,
      url,
      description,
    });

    return json(item);
  } catch (error) {
    console.error("Create item error:", error);
    return json({ error: "Failed to create item" }, { status: 500 });
  }
}
