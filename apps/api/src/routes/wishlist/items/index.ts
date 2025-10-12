import { Hono } from "hono";
import { createDatabase } from "../../../lib/db.js";
import { AuthService } from "../../../lib/auth/service.js";
import { WishlistService } from "../../../lib/wishlist/service.js";
import { getSessionCookie } from "../../../lib/auth/session.js";
import { getD1 } from "../../../lib/cloudflare.js";

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

    const pageParam = c.req.query("page");
    const pageSizeParam = c.req.query("pageSize");
    const categoryIdParam = c.req.query("categoryId");
    const searchParam = c.req.query("search");

    const DEFAULT_PAGE_SIZE = 10;
    const MAX_PAGE_SIZE = 50;

    const parsedPage = Number.parseInt(pageParam ?? "", 10);
    const parsedPageSize = Number.parseInt(pageSizeParam ?? "", 10);

    const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
    const requestedPageSize =
      Number.isFinite(parsedPageSize) && parsedPageSize > 0
        ? parsedPageSize
        : DEFAULT_PAGE_SIZE;
    const pageSize = Math.min(requestedPageSize, MAX_PAGE_SIZE);
    const offset = (page - 1) * pageSize;

    const categoryId =
      typeof categoryIdParam === "string" && categoryIdParam.length > 0
        ? categoryIdParam
        : undefined;
    const trimmedSearch =
      typeof searchParam === "string" ? searchParam.trim() : undefined;
    const search =
      trimmedSearch && trimmedSearch.length > 0 ? trimmedSearch : undefined;

    const wishlistService = new WishlistService(db);
    const { items, pagination } = await wishlistService.getUserWishlistData(
      user.id,
      {
        limit: pageSize,
        offset,
        categoryId,
        search,
      },
    );

    return c.json({ items, pagination });
  } catch (error) {
    console.error("List wishlist items error:", error);
    return c.json({ error: "Failed to get wishlist items" }, { status: 500 });
  }
});

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

    const { title, url, description, category_id, link_description, favicon } =
      await c.req.json<{
        title?: string;
        url?: string;
        description?: string;
        category_id?: string;
        link_description?: string;
        favicon?: string;
      }>();

    if (!title || !category_id) {
      return c.json(
        { error: "Title and category are required" },
        { status: 400 },
      );
    }

    const wishlistService = new WishlistService(db);
    const item = await wishlistService.createItem({
      user_id: user.id,
      category_id,
      title,
      description,
      favicon,
    });

    let primaryLink = null;
    // If URL is provided, create a primary link
    if (url) {
      primaryLink = await wishlistService.createItemLink({
        item_id: item.id,
        url,
        description: link_description,
        is_primary: true,
      });
    }

    return c.json({
      ...item,
      links: primaryLink ? [primaryLink] : [],
    });
  } catch (error) {
    console.error("Create item error:", error);
    return c.json({ error: "Failed to create item" }, { status: 500 });
  }
});

export default app;

// Enable HMR
if (import.meta.hot) {
  import.meta.hot.accept();
}
