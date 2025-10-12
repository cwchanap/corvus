import { beforeEach, describe, expect, it, vi } from "vitest";
import itemsApp from "../../../../src/routes/wishlist/items/index";
import { AuthService } from "../../../../src/lib/auth/service";
import { WishlistService } from "../../../../src/lib/wishlist/service";
import * as dbModule from "../../../../src/lib/db";
import * as cloudflareModule from "../../../../src/lib/cloudflare";
import * as sessionModule from "../../../../src/lib/auth/session";

const jsonHeaders = { "Content-Type": "application/json" };
const user = {
  id: 9,
  email: "user@example.com",
  name: "User",
  created_at: "2024-01-01",
  updated_at: "2024-01-01",
};

function authenticate() {
  vi.spyOn(sessionModule, "getSessionCookie").mockReturnValue("session-1");
  vi.spyOn(AuthService.prototype, "validateSession").mockResolvedValue(user);
}

describe("wishlist items index routes", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(dbModule, "createDatabase").mockReturnValue({} as any);
    vi.spyOn(cloudflareModule, "getD1").mockReturnValue({} as any);
  });

  describe("GET /", () => {
    it("requires authentication", async () => {
      vi.spyOn(sessionModule, "getSessionCookie").mockReturnValue(undefined);

      const response = await itemsApp.request("/");

      expect(response.status).toBe(401);
      await expect(response.json()).resolves.toEqual({
        error: "Not authenticated",
      });
    });

    it("returns paginated wishlist items", async () => {
      authenticate();
      const wishlistResponse = {
        items: [{ id: "item-1" }],
        pagination: { total_items: 1, page: 1, page_size: 10, total_pages: 1 },
      };
      const getSpy = vi
        .spyOn(WishlistService.prototype, "getUserWishlistData")
        .mockResolvedValue(wishlistResponse);

      const response = await itemsApp.request(
        "/?page=3&pageSize=20&categoryId=cat-1&search=%20desk%20",
      );

      expect(getSpy).toHaveBeenCalledWith(9, {
        limit: 20,
        offset: 40,
        categoryId: "cat-1",
        search: "desk",
      });
      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toEqual(wishlistResponse);
    });

    it("handles service errors", async () => {
      authenticate();
      vi.spyOn(
        WishlistService.prototype,
        "getUserWishlistData",
      ).mockRejectedValue(new Error("fail"));
      vi.spyOn(console, "error").mockImplementation(() => {});

      const response = await itemsApp.request("/");

      expect(response.status).toBe(500);
      await expect(response.json()).resolves.toEqual({
        error: "Failed to get wishlist items",
      });
    });
  });

  describe("POST /", () => {
    it("requires authentication", async () => {
      vi.spyOn(sessionModule, "getSessionCookie").mockReturnValue(undefined);

      const response = await itemsApp.request("/", {
        method: "POST",
        headers: jsonHeaders,
        body: JSON.stringify({}),
      });

      expect(response.status).toBe(401);
    });

    it("validates required fields", async () => {
      authenticate();

      const response = await itemsApp.request("/", {
        method: "POST",
        headers: jsonHeaders,
        body: JSON.stringify({ title: "Wish" }),
      });

      expect(response.status).toBe(400);
      await expect(response.json()).resolves.toEqual({
        error: "Title and category are required",
      });
    });

    it("creates item and optional primary link", async () => {
      authenticate();
      const item = {
        id: "item-1",
        user_id: user.id,
        category_id: "cat-1",
        title: "Desk",
        description: null,
        favicon: null,
        created_at: "2024",
        updated_at: "2024",
      };
      const link = {
        id: "link-1",
        item_id: "item-1",
        url: "https://example.com",
        description: "Primary",
        is_primary: true,
        created_at: "2024",
        updated_at: "2024",
      };
      const createItemSpy = vi
        .spyOn(WishlistService.prototype, "createItem")
        .mockResolvedValue(item);
      const createItemLinkSpy = vi
        .spyOn(WishlistService.prototype, "createItemLink")
        .mockResolvedValue(link);

      const response = await itemsApp.request("/", {
        method: "POST",
        headers: jsonHeaders,
        body: JSON.stringify({
          title: "Desk",
          category_id: "cat-1",
          url: "https://example.com",
          link_description: "Primary",
        }),
      });

      expect(createItemSpy).toHaveBeenCalledWith({
        user_id: user.id,
        category_id: "cat-1",
        title: "Desk",
        description: undefined,
        favicon: undefined,
      });
      expect(createItemLinkSpy).toHaveBeenCalledWith({
        item_id: "item-1",
        url: "https://example.com",
        description: "Primary",
        is_primary: true,
      });
      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toEqual({
        ...item,
        links: [link],
      });
    });

    it("creates item without primary link when url missing", async () => {
      authenticate();
      const item = {
        id: "item-2",
        user_id: user.id,
        category_id: "cat-1",
        title: "Desk",
        description: null,
        favicon: null,
        created_at: "2024",
        updated_at: "2024",
      };
      vi.spyOn(WishlistService.prototype, "createItem").mockResolvedValue(item);
      const createItemLinkSpy = vi.spyOn(
        WishlistService.prototype,
        "createItemLink",
      );

      const response = await itemsApp.request("/", {
        method: "POST",
        headers: jsonHeaders,
        body: JSON.stringify({
          title: "Desk",
          category_id: "cat-1",
        }),
      });

      expect(createItemLinkSpy).not.toHaveBeenCalled();
      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toEqual({
        ...item,
        links: [],
      });
    });

    it("handles creation errors", async () => {
      authenticate();
      vi.spyOn(WishlistService.prototype, "createItem").mockRejectedValue(
        new Error("fail"),
      );
      vi.spyOn(console, "error").mockImplementation(() => {});

      const response = await itemsApp.request("/", {
        method: "POST",
        headers: jsonHeaders,
        body: JSON.stringify({
          title: "Desk",
          category_id: "cat-1",
        }),
      });

      expect(response.status).toBe(500);
      await expect(response.json()).resolves.toEqual({
        error: "Failed to create item",
      });
    });
  });
});
