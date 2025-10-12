import { beforeEach, describe, expect, it, vi } from "vitest";
import logoutApp from "../../../src/routes/auth/logout";
import { AuthService } from "../../../src/lib/auth/service";
import * as dbModule from "../../../src/lib/db";
import * as cloudflareModule from "../../../src/lib/cloudflare";
import * as sessionModule from "../../../src/lib/auth/session";

let clearCookieSpy: ReturnType<typeof vi.spyOn>;

describe("GET /api/auth/logout", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(dbModule, "createDatabase").mockReturnValue({} as any);
    vi.spyOn(cloudflareModule, "getD1").mockReturnValue({} as any);
    clearCookieSpy = vi
      .spyOn(sessionModule, "clearSessionCookie")
      .mockImplementation(() => {});
  });

  it("deletes session when cookie present and redirects home", async () => {
    vi.spyOn(sessionModule, "getSessionCookie").mockReturnValue("session-1");
    const deleteSessionSpy = vi
      .spyOn(AuthService.prototype, "deleteSession")
      .mockResolvedValue();

    const response = await logoutApp.request("/logout");

    expect(deleteSessionSpy).toHaveBeenCalledWith("session-1");
    expect(clearCookieSpy).toHaveBeenCalled();
    expect(response.status).toBe(302);
    expect(response.headers.get("Location")).toBe("/");
  });

  it("skips delete when session cookie missing", async () => {
    vi.spyOn(sessionModule, "getSessionCookie").mockReturnValue(undefined);
    const deleteSessionSpy = vi.spyOn(AuthService.prototype, "deleteSession");

    const response = await logoutApp.request("/logout");

    expect(deleteSessionSpy).not.toHaveBeenCalled();
    expect(clearCookieSpy).toHaveBeenCalled();
    expect(response.status).toBe(302);
    expect(response.headers.get("Location")).toBe("/");
  });

  it("continues redirect even when delete fails", async () => {
    vi.spyOn(sessionModule, "getSessionCookie").mockReturnValue("session-1");
    vi.spyOn(AuthService.prototype, "deleteSession").mockRejectedValue(
      new Error("db down"),
    );

    const response = await logoutApp.request("/logout");

    expect(clearCookieSpy).toHaveBeenCalled();
    expect(response.status).toBe(302);
    expect(response.headers.get("Location")).toBe("/");
  });
});
