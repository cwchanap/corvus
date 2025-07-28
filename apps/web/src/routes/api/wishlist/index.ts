import { json } from "@solidjs/router";
import { getRequestEvent } from "solid-js/web";
import { createDatabase } from "../../../lib/db";
import { AuthService } from "../../../lib/auth/service";
import { WishlistService } from "../../../lib/wishlist/service";
import { getSessionCookie } from "../../../lib/auth/session";

export async function GET() {
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
    const wishlistData = await wishlistService.getUserWishlistData(user.id);

    return json(wishlistData);
  } catch (error) {
    console.error("Get wishlist error:", error);
    return json({ error: "Failed to get wishlist" }, { status: 500 });
  }
}
