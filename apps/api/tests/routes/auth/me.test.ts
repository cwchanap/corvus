import { beforeEach, describe, expect, it, vi } from "vitest";
import meApp from "../../../src/routes/auth/me";
import { AuthService } from "../../../src/lib/auth/service";
import * as dbModule from "../../../src/lib/db";
import * as cloudflareModule from "../../../src/lib/cloudflare";
import * as sessionModule from "../../../src/lib/auth/session";

describe("GET /api/auth/me", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(dbModule, "createDatabase").mockReturnValue({} as any);
    vi.spyOn(cloudflareModule, "getD1").mockReturnValue({} as any);
  });

  it("returns null user when session cookie missing", async () => {
    vi.spyOn(sessionModule, "getSessionCookie").mockReturnValue(undefined);

    const response = await meApp.request("/me");

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ user: null });
  });

  it("returns null user when session invalid", async () => {
    vi.spyOn(sessionModule, "getSessionCookie").mockReturnValue("session-1");
    vi.spyOn(AuthService.prototype, "validateSession").mockResolvedValue(null);

    const response = await meApp.request("/me");

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ user: null });
  });

  it("returns authenticated user when session valid", async () => {
    vi.spyOn(sessionModule, "getSessionCookie").mockReturnValue("session-1");
    vi.spyOn(AuthService.prototype, "validateSession").mockResolvedValue({
      id: 1,
      email: "user@example.com",
      name: "Test User",
      created_at: "2024-01-01",
      updated_at: "2024-01-01",
    });

    const response = await meApp.request("/me");

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      user: {
        id: 1,
        email: "user@example.com",
        name: "Test User",
        created_at: "2024-01-01",
        updated_at: "2024-01-01",
      },
    });
  });
});
