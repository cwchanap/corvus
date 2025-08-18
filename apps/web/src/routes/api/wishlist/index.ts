import { json } from "@solidjs/router";
import { createDatabase } from "../../../lib/db.js";
import { AuthService } from "../../../lib/auth/service.js";
import { WishlistService } from "../../../lib/wishlist/service.js";
import { getSessionCookie } from "../../../lib/auth/session.js";
import { getD1 } from "../../../lib/cloudflare.js";

export async function GET() {
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
    const wishlistData = await wishlistService.getUserWishlistData(user.id);

    return json(wishlistData);
  } catch (error) {
    console.error("Get wishlist error:", error);
    return json({ error: "Failed to get wishlist" }, { status: 500 });
  }
}
