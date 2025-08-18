import { json } from "@solidjs/router";
import { createDatabase } from "../../../lib/db.js";
import { AuthService } from "../../../lib/auth/service.js";
import { WishlistService } from "../../../lib/wishlist/service.js";
import { getSessionCookie } from "../../../lib/auth/session.js";
import { getD1 } from "../../../lib/cloudflare.js";

export async function POST({ request }: { request: Request }) {
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

    const { title, url, description, category_id } = (await request.json()) as {
      title: string;
      url: string;
      description?: string;
      category_id: string;
    };

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
