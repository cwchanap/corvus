import { beforeEach, describe, expect, it, vi } from "vitest";
import wishlistApp from "../../../src/routes/wishlist/index";
import { AuthService } from "../../../src/lib/auth/service";
import { WishlistService } from "../../../src/lib/wishlist/service";
import * as dbModule from "../../../src/lib/db";
import * as cloudflareModule from "../../../src/lib/cloudflare";
import * as sessionModule from "../../../src/lib/auth/session";

const baseUser = {
  id: 42,
  email: "user@example.com",
  name: "Test User",
  created_at: "2024-01-01",
  updated_at: "2024-01-01",
};

describe("GET /api/wishlist", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(dbModule, "createDatabase").mockReturnValue({} as any);
    vi.spyOn(cloudflareModule, "getD1").mockReturnValue({} as any);
  });

  it("requires authentication", async () => {
    vi.spyOn(sessionModule, "getSessionCookie").mockReturnValue(undefined);

    const response = await wishlistApp.request("/");

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      error: "Not authenticated",
    });
  });

  it("rejects invalid sessions", async () => {
    vi.spyOn(sessionModule, "getSessionCookie").mockReturnValue("session-1");
    vi.spyOn(AuthService.prototype, "validateSession").mockResolvedValue(null);

    const response = await wishlistApp.request("/");

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      error: "Invalid session",
    });
  });

  it("responds with wishlist data using parsed query options", async () => {
    vi.spyOn(sessionModule, "getSessionCookie").mockReturnValue("session-1");
    vi.spyOn(AuthService.prototype, "validateSession").mockResolvedValue(
      baseUser,
    );
    const wishlistData = {
      categories: [],
      items: [],
      pagination: {
        total_items: 0,
        page: 2,
        page_size: 5,
        total_pages: 0,
        has_next: false,
        has_previous: true,
      },
    };
    const getWishlistSpy = vi
      .spyOn(WishlistService.prototype, "getUserWishlistData")
      .mockResolvedValue(wishlistData);

    const response = await wishlistApp.request(
      "/?page=2&pageSize=5&categoryId=cat-5&search=%20gifts%20",
    );

    expect(getWishlistSpy).toHaveBeenCalledWith(42, {
      limit: 5,
      offset: 5,
      categoryId: "cat-5",
      search: "gifts",
    });
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(wishlistData);
  });

  it("handles service errors", async () => {
    vi.spyOn(sessionModule, "getSessionCookie").mockReturnValue("session-1");
    vi.spyOn(AuthService.prototype, "validateSession").mockResolvedValue(
      baseUser,
    );
    vi.spyOn(
      WishlistService.prototype,
      "getUserWishlistData",
    ).mockRejectedValue(new Error("boom"));
    vi.spyOn(console, "error").mockImplementation(() => {});

    const response = await wishlistApp.request("/");

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: "Failed to get wishlist",
    });
  });
});
