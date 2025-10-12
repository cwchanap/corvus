import { beforeEach, describe, expect, it, vi } from "vitest";
import categoriesApp from "../../../src/routes/wishlist/categories/index";
import { AuthService } from "../../../src/lib/auth/service";
import { WishlistService } from "../../../src/lib/wishlist/service";
import * as dbModule from "../../../src/lib/db";
import * as cloudflareModule from "../../../src/lib/cloudflare";
import * as sessionModule from "../../../src/lib/auth/session";

const jsonHeaders = { "Content-Type": "application/json" };
const user = {
  id: 7,
  email: "user@example.com",
  name: "User",
  created_at: "2024-01-01",
  updated_at: "2024-01-01",
};

function authenticate() {
  vi.spyOn(sessionModule, "getSessionCookie").mockReturnValue("session-1");
  vi.spyOn(AuthService.prototype, "validateSession").mockResolvedValue(user);
}

describe("wishlist categories routes", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(dbModule, "createDatabase").mockReturnValue({} as any);
    vi.spyOn(cloudflareModule, "getD1").mockReturnValue({} as any);
  });

  describe("POST /", () => {
    it("requires authentication", async () => {
      vi.spyOn(sessionModule, "getSessionCookie").mockReturnValue(undefined);

      const response = await categoriesApp.request("/", {
        method: "POST",
        headers: jsonHeaders,
        body: JSON.stringify({ name: "New" }),
      });

      expect(response.status).toBe(401);
    });

    it("validates category name", async () => {
      authenticate();

      const response = await categoriesApp.request("/", {
        method: "POST",
        headers: jsonHeaders,
        body: JSON.stringify({ name: "   " }),
      });

      expect(response.status).toBe(400);
      await expect(response.json()).resolves.toEqual({
        error: "Name is required",
      });
    });

    it("creates category for user", async () => {
      authenticate();
      const category = {
        id: "cat-1",
        user_id: user.id,
        name: "Work",
        color: "#fff",
        created_at: "2024",
        updated_at: "2024",
      };
      const createSpy = vi
        .spyOn(WishlistService.prototype, "createCategory")
        .mockResolvedValue(category);

      const response = await categoriesApp.request("/", {
        method: "POST",
        headers: jsonHeaders,
        body: JSON.stringify({ name: "Work", color: "#fff" }),
      });

      expect(createSpy).toHaveBeenCalledWith({
        user_id: user.id,
        name: "Work",
        color: "#fff",
      });
      expect(response.status).toBe(201);
      await expect(response.json()).resolves.toEqual(category);
    });

    it("handles service errors", async () => {
      authenticate();
      vi.spyOn(WishlistService.prototype, "createCategory").mockRejectedValue(
        new Error("fail"),
      );
      vi.spyOn(console, "error").mockImplementation(() => {});

      const response = await categoriesApp.request("/", {
        method: "POST",
        headers: jsonHeaders,
        body: JSON.stringify({ name: "Work" }),
      });

      expect(response.status).toBe(500);
      await expect(response.json()).resolves.toEqual({
        error: "Failed to create category",
      });
    });
  });

  describe("DELETE /:id", () => {
    it("requires authentication", async () => {
      vi.spyOn(sessionModule, "getSessionCookie").mockReturnValue(undefined);

      const response = await categoriesApp.request("/abc", {
        method: "DELETE",
      });

      expect(response.status).toBe(401);
    });

    it("deletes category", async () => {
      authenticate();
      const deleteSpy = vi
        .spyOn(WishlistService.prototype, "deleteCategory")
        .mockResolvedValue();

      const response = await categoriesApp.request("/abc", {
        method: "DELETE",
      });

      expect(deleteSpy).toHaveBeenCalledWith("abc", user.id);
      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toEqual({ success: true });
    });

    it("maps known deletion errors to 400", async () => {
      authenticate();
      vi.spyOn(WishlistService.prototype, "deleteCategory").mockRejectedValue(
        new Error("Cannot delete the last category"),
      );
      vi.spyOn(console, "error").mockImplementation(() => {});

      const response = await categoriesApp.request("/abc", {
        method: "DELETE",
      });

      expect(response.status).toBe(400);
      await expect(response.json()).resolves.toEqual({
        error: "Cannot delete the last category",
      });
    });

    it("handles unexpected errors", async () => {
      authenticate();
      vi.spyOn(WishlistService.prototype, "deleteCategory").mockRejectedValue(
        new Error("boom"),
      );
      vi.spyOn(console, "error").mockImplementation(() => {});

      const response = await categoriesApp.request("/abc", {
        method: "DELETE",
      });

      expect(response.status).toBe(500);
      await expect(response.json()).resolves.toEqual({
        error: "Failed to delete category",
      });
    });
  });

  describe("PATCH /:id", () => {
    it("requires authentication", async () => {
      vi.spyOn(sessionModule, "getSessionCookie").mockReturnValue(undefined);

      const response = await categoriesApp.request("/abc", {
        method: "PATCH",
        headers: jsonHeaders,
        body: JSON.stringify({ name: "New name" }),
      });

      expect(response.status).toBe(401);
    });

    it("validates non-empty name when provided", async () => {
      authenticate();

      const response = await categoriesApp.request("/abc", {
        method: "PATCH",
        headers: jsonHeaders,
        body: JSON.stringify({ name: " " }),
      });

      expect(response.status).toBe(400);
      await expect(response.json()).resolves.toEqual({
        error: "Name cannot be empty",
      });
    });

    it("requires at least one updatable field", async () => {
      authenticate();

      const response = await categoriesApp.request("/abc", {
        method: "PATCH",
        headers: jsonHeaders,
        body: JSON.stringify({}),
      });

      expect(response.status).toBe(400);
      await expect(response.json()).resolves.toEqual({
        error: "No valid fields to update",
      });
    });

    it("updates category when found", async () => {
      authenticate();
      const category = {
        id: "abc",
        user_id: user.id,
        name: "Updated",
        color: "#000",
        created_at: "2024",
        updated_at: "2024",
      };
      const updateSpy = vi
        .spyOn(WishlistService.prototype, "updateCategory")
        .mockResolvedValue(category);

      const response = await categoriesApp.request("/abc", {
        method: "PATCH",
        headers: jsonHeaders,
        body: JSON.stringify({ name: "Updated", color: "#000" }),
      });

      expect(updateSpy).toHaveBeenCalledWith("abc", user.id, {
        name: "Updated",
        color: "#000",
      });
      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toEqual(category);
    });

    it("returns 404 when category missing", async () => {
      authenticate();
      vi.spyOn(WishlistService.prototype, "updateCategory").mockResolvedValue(
        null,
      );

      const response = await categoriesApp.request("/abc", {
        method: "PATCH",
        headers: jsonHeaders,
        body: JSON.stringify({ name: "Updated" }),
      });

      expect(response.status).toBe(404);
      await expect(response.json()).resolves.toEqual({
        error: "Category not found",
      });
    });

    it("handles update errors", async () => {
      authenticate();
      vi.spyOn(WishlistService.prototype, "updateCategory").mockRejectedValue(
        new Error("boom"),
      );
      vi.spyOn(console, "error").mockImplementation(() => {});

      const response = await categoriesApp.request("/abc", {
        method: "PATCH",
        headers: jsonHeaders,
        body: JSON.stringify({ name: "Updated" }),
      });

      expect(response.status).toBe(500);
      await expect(response.json()).resolves.toEqual({
        error: "Failed to update category",
      });
    });
  });
});
