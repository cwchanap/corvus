import { beforeEach, describe, expect, it, vi } from "vitest";
import registerApp from "../../../src/routes/auth/register";
import { AuthService } from "../../../src/lib/auth/service";
import * as dbModule from "../../../src/lib/db";
import * as cloudflareModule from "../../../src/lib/cloudflare";
import * as sessionModule from "../../../src/lib/auth/session";

const jsonHeaders = { "Content-Type": "application/json" };
let setCookieSpy: ReturnType<typeof vi.spyOn>;

describe("POST /api/auth/register", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(dbModule, "createDatabase").mockReturnValue({} as any);
    vi.spyOn(cloudflareModule, "getD1").mockReturnValue({} as any);
    setCookieSpy = vi
      .spyOn(sessionModule, "setSessionCookie")
      .mockImplementation(() => {});
  });

  it("requires email, password, and name", async () => {
    const response = await registerApp.request("/register", {
      method: "POST",
      headers: jsonHeaders,
      body: JSON.stringify({ email: "user@example.com", password: "test" }),
    });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Email, password, and name are required",
    });
  });

  it("creates a new user and session", async () => {
    vi.spyOn(AuthService.prototype, "register").mockResolvedValue({
      id: 2,
      email: "new@example.com",
      name: "New User",
      created_at: "2024-02-01T00:00:00.000Z",
      updated_at: "2024-02-01T00:00:00.000Z",
    });
    vi.spyOn(AuthService.prototype, "createSession").mockResolvedValue(
      "session-abc",
    );

    const response = await registerApp.request("/register", {
      method: "POST",
      headers: jsonHeaders,
      body: JSON.stringify({
        email: "new@example.com",
        password: "strong-password",
        name: "New User",
      }),
    });

    expect(response.status).toBe(200);
    expect(setCookieSpy).toHaveBeenCalledWith(
      expect.any(Object),
      "session-abc",
    );
    await expect(response.json()).resolves.toEqual({
      success: true,
      user: {
        id: 2,
        email: "new@example.com",
        name: "New User",
      },
    });
  });

  it("handles user already exists error", async () => {
    vi.spyOn(AuthService.prototype, "register").mockRejectedValue(
      new Error("User already exists"),
    );
    vi.spyOn(console, "error").mockImplementation(() => {});

    const response = await registerApp.request("/register", {
      method: "POST",
      headers: jsonHeaders,
      body: JSON.stringify({
        email: "new@example.com",
        password: "strong-password",
        name: "New User",
      }),
    });

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({
      error: "User already exists",
    });
  });

  it("handles unexpected errors", async () => {
    vi.spyOn(AuthService.prototype, "register").mockRejectedValue(
      new Error("boom"),
    );
    vi.spyOn(console, "error").mockImplementation(() => {});

    const response = await registerApp.request("/register", {
      method: "POST",
      headers: jsonHeaders,
      body: JSON.stringify({
        email: "new@example.com",
        password: "strong-password",
        name: "New User",
      }),
    });

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: "Internal server error",
    });
  });
});
