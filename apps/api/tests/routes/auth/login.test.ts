import { describe, expect, it, beforeEach, vi } from "vitest";
import loginApp from "../../../src/routes/auth/login";
import { AuthService } from "../../../src/lib/auth/service";
import * as dbModule from "../../../src/lib/db";
import * as cloudflareModule from "../../../src/lib/cloudflare";
import * as sessionModule from "../../../src/lib/auth/session";

const jsonHeaders = { "Content-Type": "application/json" };

let setCookieSpy: ReturnType<typeof vi.spyOn>;

describe("POST /api/auth/login", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(dbModule, "createDatabase").mockReturnValue({} as any);
    vi.spyOn(cloudflareModule, "getD1").mockReturnValue({} as any);
    setCookieSpy = vi
      .spyOn(sessionModule, "setSessionCookie")
      .mockImplementation(() => {});
  });

  it("validates required fields", async () => {
    const response = await loginApp.request("/login", {
      method: "POST",
      headers: jsonHeaders,
      body: JSON.stringify({ email: "user@example.com" }),
    });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Email and password are required",
    });
  });

  it("rejects invalid credentials", async () => {
    vi.spyOn(AuthService.prototype, "login").mockResolvedValue(null);

    const response = await loginApp.request("/login", {
      method: "POST",
      headers: jsonHeaders,
      body: JSON.stringify({
        email: "user@example.com",
        password: "bad-password",
      }),
    });

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      error: "Invalid email or password",
    });
  });

  it("creates session and returns user details", async () => {
    vi.spyOn(AuthService.prototype, "login").mockResolvedValue({
      id: 1,
      email: "user@example.com",
      name: "Test User",
      created_at: "2024-02-01T00:00:00.000Z",
      updated_at: "2024-02-01T00:00:00.000Z",
    });
    vi.spyOn(AuthService.prototype, "createSession").mockResolvedValue(
      "session-123",
    );
    const response = await loginApp.request("/login", {
      method: "POST",
      headers: jsonHeaders,
      body: JSON.stringify({
        email: "user@example.com",
        password: "good-password",
      }),
    });

    expect(response.status).toBe(200);
    expect(setCookieSpy).toHaveBeenCalledWith(
      expect.any(Object),
      "session-123",
    );
    await expect(response.json()).resolves.toEqual({
      success: true,
      user: {
        id: 1,
        email: "user@example.com",
        name: "Test User",
      },
    });
  });

  it("handles unexpected errors", async () => {
    vi.spyOn(AuthService.prototype, "login").mockRejectedValue(
      new Error("boom"),
    );
    vi.spyOn(console, "error").mockImplementation(() => {});

    const response = await loginApp.request("/login", {
      method: "POST",
      headers: jsonHeaders,
      body: JSON.stringify({
        email: "user@example.com",
        password: "any",
      }),
    });

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: "Internal server error",
    });
  });
});
