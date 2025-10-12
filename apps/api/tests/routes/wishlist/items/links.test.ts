import { beforeEach, describe, expect, it, vi } from "vitest";
import itemLinksApp from "../../../../src/routes/wishlist/items/links";
import { AuthService } from "../../../../src/lib/auth/service";
import { WishlistService } from "../../../../src/lib/wishlist/service";
import * as dbModule from "../../../../src/lib/db";
import * as cloudflareModule from "../../../../src/lib/cloudflare";
import * as sessionModule from "../../../../src/lib/auth/session";

const jsonHeaders = { "Content-Type": "application/json" };
const user = {
  id: 15,
  email: "user@example.com",
  name: "User",
  created_at: "2024-01-01",
  updated_at: "2024-01-01",
};

function authenticate() {
  vi.spyOn(sessionModule, "getSessionCookie").mockReturnValue("session-1");
  vi.spyOn(AuthService.prototype, "validateSession").mockResolvedValue(user);
}

describe("wishlist item links routes", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(dbModule, "createDatabase").mockReturnValue({} as any);
    vi.spyOn(cloudflareModule, "getD1").mockReturnValue({} as any);
  });

  describe("GET /:itemId", () => {
    it("requires authentication", async () => {
      vi.spyOn(sessionModule, "getSessionCookie").mockReturnValue(undefined);

      const response = await itemLinksApp.request("/item-1");

      expect(response.status).toBe(401);
      await expect(response.json()).resolves.toEqual({
        error: "Not authenticated",
      });
    });

    it("returns item links", async () => {
      authenticate();
      const links = [{ id: "link-1" }];
      const getLinksSpy = vi
        .spyOn(WishlistService.prototype, "getItemLinks")
        .mockResolvedValue(links as any);

      const response = await itemLinksApp.request("/item-1");

      expect(getLinksSpy).toHaveBeenCalledWith("item-1");
      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toEqual(links);
    });

    it("handles errors", async () => {
      authenticate();
      vi.spyOn(WishlistService.prototype, "getItemLinks").mockRejectedValue(
        new Error("fail"),
      );
      vi.spyOn(console, "error").mockImplementation(() => {});

      const response = await itemLinksApp.request("/item-1");

      expect(response.status).toBe(500);
      await expect(response.json()).resolves.toEqual({
        error: "Failed to get item links",
      });
    });
  });

  describe("POST /:itemId", () => {
    it("validates required url", async () => {
      authenticate();

      const response = await itemLinksApp.request("/item-1", {
        method: "POST",
        headers: jsonHeaders,
        body: JSON.stringify({}),
      });

      expect(response.status).toBe(400);
      await expect(response.json()).resolves.toEqual({
        error: "URL is required",
      });
    });

    it("creates link when valid", async () => {
      authenticate();
      const link = {
        id: "link-1",
        item_id: "item-1",
        url: "https://example.com",
        description: null,
        is_primary: false,
        created_at: "2024",
        updated_at: "2024",
      };
      const createSpy = vi
        .spyOn(WishlistService.prototype, "createItemLink")
        .mockResolvedValue(link);

      const response = await itemLinksApp.request("/item-1", {
        method: "POST",
        headers: jsonHeaders,
        body: JSON.stringify({ url: "https://example.com" }),
      });

      expect(createSpy).toHaveBeenCalledWith({
        item_id: "item-1",
        url: "https://example.com",
        description: undefined,
        is_primary: false,
      });
      expect(response.status).toBe(201);
      await expect(response.json()).resolves.toEqual(link);
    });

    it("handles creation errors", async () => {
      authenticate();
      vi.spyOn(WishlistService.prototype, "createItemLink").mockRejectedValue(
        new Error("fail"),
      );
      vi.spyOn(console, "error").mockImplementation(() => {});

      const response = await itemLinksApp.request("/item-1", {
        method: "POST",
        headers: jsonHeaders,
        body: JSON.stringify({ url: "https://example.com" }),
      });

      expect(response.status).toBe(500);
      await expect(response.json()).resolves.toEqual({
        error: "Failed to create item link",
      });
    });
  });

  describe("PATCH /:itemId/links/:linkId", () => {
    it("returns updated link when exists", async () => {
      authenticate();
      const link = { id: "link-1" };
      const updateSpy = vi
        .spyOn(WishlistService.prototype, "updateItemLink")
        .mockResolvedValue(link as any);

      const response = await itemLinksApp.request("/item-1/links/link-1", {
        method: "PATCH",
        headers: jsonHeaders,
        body: JSON.stringify({ description: "Updated" }),
      });

      expect(updateSpy).toHaveBeenCalledWith("link-1", {
        description: "Updated",
      });
      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toEqual(link);
    });

    it("returns 404 when link missing", async () => {
      authenticate();
      vi.spyOn(WishlistService.prototype, "updateItemLink").mockResolvedValue(
        null,
      );

      const response = await itemLinksApp.request("/item-1/links/link-1", {
        method: "PATCH",
        headers: jsonHeaders,
        body: JSON.stringify({}),
      });

      expect(response.status).toBe(404);
      await expect(response.json()).resolves.toEqual({
        error: "Link not found",
      });
    });

    it("handles update errors", async () => {
      authenticate();
      vi.spyOn(WishlistService.prototype, "updateItemLink").mockRejectedValue(
        new Error("fail"),
      );
      vi.spyOn(console, "error").mockImplementation(() => {});

      const response = await itemLinksApp.request("/item-1/links/link-1", {
        method: "PATCH",
        headers: jsonHeaders,
        body: JSON.stringify({}),
      });

      expect(response.status).toBe(500);
      await expect(response.json()).resolves.toEqual({
        error: "Failed to update item link",
      });
    });
  });

  describe("POST /:itemId/links/:linkId/primary", () => {
    it("sets primary link", async () => {
      authenticate();
      const setPrimarySpy = vi
        .spyOn(WishlistService.prototype, "setPrimaryLink")
        .mockResolvedValue();

      const response = await itemLinksApp.request(
        "/item-1/links/link-1/primary",
        { method: "POST" },
      );

      expect(setPrimarySpy).toHaveBeenCalledWith("item-1", "link-1");
      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toEqual({ success: true });
    });

    it("handles errors while setting primary link", async () => {
      authenticate();
      vi.spyOn(WishlistService.prototype, "setPrimaryLink").mockRejectedValue(
        new Error("fail"),
      );
      vi.spyOn(console, "error").mockImplementation(() => {});

      const response = await itemLinksApp.request(
        "/item-1/links/link-1/primary",
        { method: "POST" },
      );

      expect(response.status).toBe(500);
      await expect(response.json()).resolves.toEqual({
        error: "Failed to set primary link",
      });
    });
  });

  describe("DELETE /:itemId/links/:linkId", () => {
    it("deletes the link", async () => {
      authenticate();
      const deleteSpy = vi
        .spyOn(WishlistService.prototype, "deleteItemLink")
        .mockResolvedValue();

      const response = await itemLinksApp.request("/item-1/links/link-1", {
        method: "DELETE",
      });

      expect(deleteSpy).toHaveBeenCalledWith("link-1");
      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toEqual({ success: true });
    });

    it("handles deletion errors", async () => {
      authenticate();
      vi.spyOn(WishlistService.prototype, "deleteItemLink").mockRejectedValue(
        new Error("fail"),
      );
      vi.spyOn(console, "error").mockImplementation(() => {});

      const response = await itemLinksApp.request("/item-1/links/link-1", {
        method: "DELETE",
      });

      expect(response.status).toBe(500);
      await expect(response.json()).resolves.toEqual({
        error: "Failed to delete item link",
      });
    });
  });
});
