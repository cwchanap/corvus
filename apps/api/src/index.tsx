import type { D1Database, Fetcher } from "@cloudflare/workers-types";
import { Hono } from "hono";
import type { Context } from "hono";
import { cors } from "hono/cors";
import { createGraphQLHandler } from "./graphql/handler";
import { createDatabase } from "./lib/db";
import { getD1 } from "./lib/cloudflare";
import { AuthServiceError, GoogleAuthService } from "./lib/auth/service";
import { createD1AuthStore } from "./lib/auth/store";
import {
  OAUTH_STATE_COOKIE_NAME,
  SESSION_COOKIE_NAME,
  buildExpiredCookie,
  buildSetCookie,
  readCookie,
} from "./lib/auth/cookies";

type AppBindings = {
  DB: D1Database;
  ASSETS: Fetcher;
  DEV?: string;
  INSECURE_COOKIES?: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  GOOGLE_REDIRECT_URI?: string;
  TEST_AUTH_ENABLED?: string;
};

const app = new Hono<{ Bindings: AppBindings }>();

const OAUTH_STATE_MAX_AGE_SECONDS = 10 * 60;
const SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;

function createAuthService(c: Context<{ Bindings: AppBindings }>) {
  const db = createDatabase(getD1(c));
  const store = createD1AuthStore(db);
  return new GoogleAuthService(store, c.env);
}

function cookieRequestOptions(c: Context<{ Bindings: AppBindings }>) {
  return {
    requestUrl: c.req.url,
    origin: c.req.header("origin"),
    env: c.env,
  };
}

function logOAuthCallbackFailure(error: unknown) {
  if (error instanceof AuthServiceError) {
    console.error("Google OAuth callback failed", {
      code: error.code,
      status: error.status ?? null,
      details: error.details ?? null,
    });
    return;
  }

  if (error instanceof Error) {
    console.error("Google OAuth callback failed", {
      code: "UNKNOWN",
      name: error.name,
      message: error.message,
    });
    return;
  }

  console.error("Google OAuth callback failed", {
    code: "UNKNOWN",
    type: typeof error,
  });
}

// Enable CORS for all routes
app.use(
  "*",
  cors({
    origin: (origin) => {
      if (!origin) {
        return "*";
      }

      if (
        origin.startsWith("http://localhost:") ||
        origin.startsWith("https://localhost:")
      ) {
        return origin;
      }

      if (
        origin.startsWith("chrome-extension://") ||
        origin.startsWith("moz-extension://")
      ) {
        return origin;
      }

      return null;
    },
    allowHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
    maxAge: 86400, // 24 hours
  }),
);

app.get("/auth/google/start", (c) => {
  const state = crypto.randomUUID();
  const authService = createAuthService(c);
  c.header(
    "Set-Cookie",
    buildSetCookie({
      name: OAUTH_STATE_COOKIE_NAME,
      value: state,
      maxAge: OAUTH_STATE_MAX_AGE_SECONDS,
      ...cookieRequestOptions(c),
    }),
    { append: true },
  );

  return c.redirect(authService.getAuthorizationUrl(state));
});

app.get("/auth/google/callback", async (c) => {
  const code = c.req.query("code");
  const returnedState = c.req.query("state");
  const expectedState = readCookie(
    c.req.header("cookie"),
    OAUTH_STATE_COOKIE_NAME,
  );

  if (
    !code ||
    !returnedState ||
    !expectedState ||
    returnedState !== expectedState
  ) {
    console.warn("Google OAuth callback rejected", {
      reason: "state_mismatch",
      hasCode: Boolean(code),
      hasReturnedState: Boolean(returnedState),
      hasExpectedState: Boolean(expectedState),
      stateMatches:
        Boolean(returnedState) &&
        Boolean(expectedState) &&
        returnedState === expectedState,
    });
    c.header(
      "Set-Cookie",
      buildExpiredCookie({
        name: OAUTH_STATE_COOKIE_NAME,
        ...cookieRequestOptions(c),
      }),
      { append: true },
    );
    return c.redirect("/login?error=auth_failed");
  }

  const authService = createAuthService(c);
  let result;
  try {
    result = await authService.handleCallback(code);
  } catch (error) {
    logOAuthCallbackFailure(error);
    c.header(
      "Set-Cookie",
      buildExpiredCookie({
        name: OAUTH_STATE_COOKIE_NAME,
        ...cookieRequestOptions(c),
      }),
      { append: true },
    );
    return c.redirect("/login?error=auth_failed");
  }
  c.header(
    "Set-Cookie",
    buildSetCookie({
      name: SESSION_COOKIE_NAME,
      value: result.sessionId,
      maxAge: SESSION_MAX_AGE_SECONDS,
      expires: result.expiresAt,
      ...cookieRequestOptions(c),
    }),
    { append: true },
  );
  c.header(
    "Set-Cookie",
    buildExpiredCookie({
      name: OAUTH_STATE_COOKIE_NAME,
      ...cookieRequestOptions(c),
    }),
    { append: true },
  );

  return c.redirect("/dashboard");
});

app.post("/__test__/auth/session", async (c) => {
  const testAuthEnabled = c.env.TEST_AUTH_ENABLED === "1";
  const nonProductionMode = c.env.DEV === "1" || c.env.INSECURE_COOKIES === "1";
  if (!testAuthEnabled || !nonProductionMode) {
    return c.text("Not found", 404);
  }

  const body = (await c.req.json().catch(() => ({}))) as {
    email?: unknown;
    name?: unknown;
    sub?: unknown;
  };
  const db = createDatabase(getD1(c));
  const store = createD1AuthStore(db);
  const user = await store.upsertGoogleUser({
    sub:
      typeof body.sub === "string" && body.sub.length > 0
        ? body.sub
        : "test-google-sub",
    email:
      typeof body.email === "string" && body.email.length > 0
        ? body.email
        : "test@example.com",
    name:
      typeof body.name === "string" && body.name.length > 0
        ? body.name
        : "Test User",
    picture: null,
  });
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000);
  const sessionId = await store.createSession(user.id, expiresAt);

  c.header(
    "Set-Cookie",
    buildSetCookie({
      name: SESSION_COOKIE_NAME,
      value: sessionId,
      maxAge: SESSION_MAX_AGE_SECONDS,
      expires: expiresAt,
      ...cookieRequestOptions(c),
    }),
    { append: true },
  );

  return c.json({ user });
});

// GraphQL endpoint
app.all("/graphql", createGraphQLHandler());

// Catch-all for serving static assets (web app)
app.get("*", async (c) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const assetResponse = await c.env.ASSETS.fetch(c.req.raw as any);

  if (assetResponse.status === 404) {
    const acceptHeader = c.req.header("accept") ?? "";

    if (acceptHeader.includes("text/html")) {
      const fallbackUrl = new URL("/index.html", c.req.url);
      const fallbackRequest = new Request(fallbackUrl, {
        method: "GET",
        headers: c.req.raw.headers,
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const fallbackResponse = await c.env.ASSETS.fetch(fallbackRequest as any);

      if (fallbackResponse.status !== 404) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return fallbackResponse as any;
      }
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return assetResponse as any;
});

export default app;

// Enable HMR
/* c8 ignore next 3 */
if (import.meta.hot) {
  import.meta.hot.accept();
}
