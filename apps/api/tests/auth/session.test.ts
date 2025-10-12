import { type Context } from "hono";
import {
  clearSessionCookie,
  getSessionCookie,
  requireAuth,
  setSessionCookie,
} from "../../src/lib/auth/session";
import type { PublicUser } from "../../src/lib/db/types";

type TestContext = Context & {
  getRecordedHeaders: () => Record<string, string>;
};

function createContext({
  dev = false,
  cookie,
}: {
  dev?: boolean;
  cookie?: string;
} = {}): TestContext {
  const headers: Record<string, string> = {};

  return {
    env: { DEV: dev } as unknown as Context["env"],
    req: {
      header: (name: string) => {
        if (name.toLowerCase() === "cookie") {
          return cookie;
        }
        return undefined;
      },
    } as Context["req"],
    header: (name: string, value: string) => {
      headers[name] = value;
    },
    getRecordedHeaders: () => headers,
  } as TestContext;
}

describe("session helpers", () => {
  it("extracts session cookie when present", () => {
    const cookieHeader = "foo=bar; corvus-session=abc123; theme=dark";
    const ctx = createContext({ cookie: cookieHeader });

    expect(getSessionCookie(ctx)).toBe("abc123");
  });

  it("returns undefined when session cookie is missing", () => {
    const ctx = createContext({ cookie: "foo=bar" });
    expect(getSessionCookie(ctx)).toBeUndefined();
  });

  it("sets http-only session cookie with dev attributes", () => {
    const ctx = createContext({ dev: true });
    setSessionCookie(ctx, "session-id");

    const headers = ctx.getRecordedHeaders();
    expect(headers["Set-Cookie"]).toContain("corvus-session=session-id");
    expect(headers["Set-Cookie"]).toContain("HttpOnly");
    expect(headers["Set-Cookie"]).toContain("SameSite=Lax");
    expect(headers["Set-Cookie"]).not.toContain("Secure");
    expect(headers["Set-Cookie"]).toContain("Max-Age=604800");
  });

  it("sets secure session cookie outside of dev", () => {
    const ctx = createContext({ dev: false });
    setSessionCookie(ctx, "session-id");

    const headers = ctx.getRecordedHeaders();
    expect(headers["Set-Cookie"]).toContain("SameSite=None");
    expect(headers["Set-Cookie"]).toContain("Secure");
  });

  it("clears the session cookie with zero max age", () => {
    const ctx = createContext({ dev: true });
    clearSessionCookie(ctx);

    const headers = ctx.getRecordedHeaders();
    expect(headers["Set-Cookie"]).toContain("corvus-session=");
    expect(headers["Set-Cookie"]).toContain("Max-Age=0");
  });

  it("requires authenticated users", () => {
    const user: PublicUser = {
      id: 1,
      email: "test@example.com",
      name: "Test User",
      created_at: "2024-01-01T00:00:00.000Z",
      updated_at: "2024-01-01T00:00:00.000Z",
    };

    expect(requireAuth(user)).toEqual(user);
    expect(() => requireAuth(null)).toThrowError("Authentication required");
  });
});
