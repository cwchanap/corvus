import { beforeEach, describe, expect, it, vi } from "vitest";
import itemDetailApp from "../../../../src/routes/wishlist/items/[id]";
import { AuthService } from "../../../../src/lib/auth/service";
import { WishlistService } from "../../../../src/lib/wishlist/service";
import * as dbModule from "../../../../src/lib/db";
import * as cloudflareModule from "../../../../src/lib/cloudflare";
import * as sessionModule from "../../../../src/lib/auth/session";

const jsonHeaders = { "Content-Type": "application/json" };
const user = {
  id: 12,
  email: "user@example.com",
  name: "User",
  created_at: "2024-01-01",
  updated_at: "2024-01-01",
};

function authenticate() {
  vi.spyOn(sessionModule, "getSessionCookie").mockReturnValue("session-1");
  vi.spyOn(AuthService.prototype, "validateSession").mockResolvedValue(user);
}

describe("wishlist item detail routes", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(dbModule, "createDatabase").mockReturnValue({} as any);
    vi.spyOn(cloudflareModule, "getD1").mockReturnValue({} as any);
  });

  describe("DELETE /:id", () => {
    it("requires authentication", async () => {
      vi.spyOn(sessionModule, "getSessionCookie").mockReturnValue(undefined);

      const response = await itemDetailApp.request("/abc", {
        method: "DELETE",
      });

      expect(response.status).toBe(401);
    });

    it("deletes the item and returns success", async () => {
      authenticate();
      const deleteSpy = vi
        .spyOn(WishlistService.prototype, "deleteItem")
        .mockResolvedValue();

      const response = await itemDetailApp.request("/abc", {
        method: "DELETE",
      });

      expect(deleteSpy).toHaveBeenCalledWith("abc", user.id);
      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toEqual({ success: true });
    });

    it("handles deletion errors", async () => {
      authenticate();
      vi.spyOn(WishlistService.prototype, "deleteItem").mockRejectedValue(
        new Error("fail"),
      );
      vi.spyOn(console, "error").mockImplementation(() => {});

      const response = await itemDetailApp.request("/abc", {
        method: "DELETE",
      });

      expect(response.status).toBe(500);
      await expect(response.json()).resolves.toEqual({
        error: "Failed to delete item",
      });
    });
  });

  describe("PUT /:id", () => {
    it("requires authentication", async () => {
      vi.spyOn(sessionModule, "getSessionCookie").mockReturnValue(undefined);

      const response = await itemDetailApp.request("/abc", {
        method: "PUT",
        headers: jsonHeaders,
        body: JSON.stringify({ title: "Updated" }),
      });

      expect(response.status).toBe(401);
    });

    it("updates item when found", async () => {
      authenticate();
      const item = {
        id: "abc",
        user_id: user.id,
        category_id: "cat",
        title: "Updated",
        description: null,
        favicon: null,
        created_at: "2024",
        updated_at: "2024",
      };
      const updateSpy = vi
        .spyOn(WishlistService.prototype, "updateItem")
        .mockResolvedValue(item);

      const response = await itemDetailApp.request("/abc", {
        method: "PUT",
        headers: jsonHeaders,
        body: JSON.stringify({ title: "Updated" }),
      });

      expect(updateSpy).toHaveBeenCalledWith("abc", user.id, {
        title: "Updated",
      });
      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toEqual(item);
    });

    it("returns 404 when item missing", async () => {
      authenticate();
      vi.spyOn(WishlistService.prototype, "updateItem").mockResolvedValue(null);

      const response = await itemDetailApp.request("/abc", {
        method: "PUT",
        headers: jsonHeaders,
        body: JSON.stringify({ title: "Updated" }),
      });

      expect(response.status).toBe(404);
      await expect(response.json()).resolves.toEqual({
        error: "Item not found",
      });
    });

    it("handles update errors", async () => {
      authenticate();
      vi.spyOn(WishlistService.prototype, "updateItem").mockRejectedValue(
        new Error("fail"),
      );
      vi.spyOn(console, "error").mockImplementation(() => {});

      const response = await itemDetailApp.request("/abc", {
        method: "PUT",
        headers: jsonHeaders,
        body: JSON.stringify({ title: "Updated" }),
      });

      expect(response.status).toBe(500);
      await expect(response.json()).resolves.toEqual({
        error: "Failed to update item",
      });
    });
  });
});
