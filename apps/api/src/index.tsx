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
  OAUTH_SOURCE_COOKIE_NAME,
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
  ALLOWED_EXTENSION_ORIGINS?: string;
  TEST_AUTH_ENABLED?: string;
};

const app = new Hono<{ Bindings: AppBindings }>();

const OAUTH_STATE_MAX_AGE_SECONDS = 10 * 60;
const SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;
const OAUTH_SOURCE_EXTENSION = "extension";

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

function appendExpiredAuthCookie(
  c: Context<{ Bindings: AppBindings }>,
  name: string,
) {
  c.header(
    "Set-Cookie",
    buildExpiredCookie({
      name,
      ...cookieRequestOptions(c),
    }),
    { append: true },
  );
}

function clearOAuthFlowCookies(c: Context<{ Bindings: AppBindings }>) {
  appendExpiredAuthCookie(c, OAUTH_STATE_COOKIE_NAME);
  appendExpiredAuthCookie(c, OAUTH_SOURCE_COOKIE_NAME);
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

function mapAuthErrorToRedirectToken(error: unknown): string {
  if (error instanceof AuthServiceError) {
    switch (error.code) {
      case "MISSING_ENV":
        return "auth_misconfig";
      case "JWKS_FETCH_FAILED":
        return "auth_provider_unavailable";
      case "INVALID_ID_TOKEN":
        return "auth_token_invalid";
      default:
        return "auth_failed";
    }
  }
  return "auth_failed";
}

function isAllowedExtensionOrigin(
  origin: string,
  allowedExtensionOrigins: string[],
): boolean {
  return allowedExtensionOrigins.some(
    (allowed) => allowed.trim().toLowerCase() === origin.toLowerCase(),
  );
}

/**
 * Determine whether a request origin is allowed for CORS and CSRF checks.
 *
 * Firefox assigns `moz-extension://<uuid>` per installation so the UUID
 * cannot be pre-allowlisted. Any `moz-extension://` origin is accepted
 * because only browser-installed extensions can hold that origin — a web
 * page cannot spoof it.
 */
function isAllowedRequestOrigin(
  origin: string,
  env: AppBindings,
  requestOrigin?: string,
): boolean {
  // Same-origin requests (e.g. SPA served by this Worker in production)
  if (requestOrigin && origin === requestOrigin) {
    return true;
  }

  if (
    origin.startsWith("http://localhost:") ||
    origin.startsWith("https://localhost:")
  ) {
    return env.DEV === "1";
  }

  // Firefox extensions: accept any moz-extension:// origin.
  // The browser guarantees only installed extensions hold these origins.
  if (origin.startsWith("moz-extension://")) {
    return true;
  }

  if (origin.startsWith("chrome-extension://")) {
    if (env.DEV === "1") {
      return true;
    }
    const allowedRaw = env.ALLOWED_EXTENSION_ORIGINS;
    if (!allowedRaw) {
      return false;
    }
    const allowed = allowedRaw.split(",").filter(Boolean);
    return isAllowedExtensionOrigin(origin, allowed);
  }

  return false;
}

app.use(
  "*",
  cors({
    origin: (origin, c) => {
      if (!origin) {
        return "*";
      }

      const env = c.env as AppBindings;
      const requestOrigin = new URL(c.req.url).origin;
      return isAllowedRequestOrigin(origin, env, requestOrigin) ? origin : null;
    },
    allowHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
    maxAge: 86400, // 24 hours
  }),
);

// CSRF protection: reject credentialed state-changing /graphql requests
// whose Origin header is not allowed. This prevents cross-site request
// forgery via credentialed fetch() calls and simple HTML form submissions
// (application/x-www-form-urlencoded) which bypass CORS preflight.
app.use("/graphql", async (c, next) => {
  const method = c.req.method;
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") {
    return next();
  }

  const hasSession = Boolean(
    readCookie(c.req.header("cookie"), SESSION_COOKIE_NAME),
  );
  if (!hasSession) {
    return next();
  }

  const origin = c.req.header("origin");
  if (!origin) {
    return c.json({ errors: [{ message: "CSRF check failed" }] }, 403);
  }

  const env = c.env as AppBindings;
  const requestOrigin = new URL(c.req.url).origin;
  if (!isAllowedRequestOrigin(origin, env, requestOrigin)) {
    return c.json({ errors: [{ message: "CSRF check failed" }] }, 403);
  }

  return next();
});

app.get("/auth/google/start", (c) => {
  const state = crypto.randomUUID();
  const oauthSource =
    c.req.query("source") === OAUTH_SOURCE_EXTENSION
      ? OAUTH_SOURCE_EXTENSION
      : null;
  const authService = createAuthService(c);

  let authorizationUrl: string;
  try {
    authorizationUrl = authService.getAuthorizationUrl(state);
  } catch (error) {
    logOAuthCallbackFailure(error);
    const retryParams = oauthSource ? "&source=extension" : "";
    return c.redirect(
      `/login?error=${mapAuthErrorToRedirectToken(error)}${retryParams}`,
    );
  }

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
  if (oauthSource) {
    c.header(
      "Set-Cookie",
      buildSetCookie({
        name: OAUTH_SOURCE_COOKIE_NAME,
        value: oauthSource,
        maxAge: OAUTH_STATE_MAX_AGE_SECONDS,
        ...cookieRequestOptions(c),
      }),
      { append: true },
    );
  } else {
    appendExpiredAuthCookie(c, OAUTH_SOURCE_COOKIE_NAME);
  }

  return c.redirect(authorizationUrl);
});

app.get("/auth/google/callback", async (c) => {
  const googleError = c.req.query("error");
  const code = c.req.query("code");
  const returnedState = c.req.query("state");
  const cookieHeader = c.req.header("cookie");
  const expectedState = readCookie(cookieHeader, OAUTH_STATE_COOKIE_NAME);
  const oauthSource = readCookie(cookieHeader, OAUTH_SOURCE_COOKIE_NAME);
  const extensionOAuthSource = oauthSource === OAUTH_SOURCE_EXTENSION;

  // Handle Google's own error response (e.g. user denied consent)
  if (googleError) {
    console.warn("Google OAuth callback rejected", {
      reason: "google_error",
      googleError,
    });
    clearOAuthFlowCookies(c);
    const retryParams = extensionOAuthSource ? "&source=extension" : "";
    const token =
      googleError === "access_denied" ? "auth_canceled" : "auth_failed";
    return c.redirect(`/login?error=${token}${retryParams}`);
  }

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
    clearOAuthFlowCookies(c);
    const retryParams = extensionOAuthSource ? "&source=extension" : "";
    return c.redirect(`/login?error=auth_state_mismatch${retryParams}`);
  }

  const authService = createAuthService(c);
  let result;
  try {
    result = await authService.handleCallback(code);
  } catch (error) {
    logOAuthCallbackFailure(error);
    clearOAuthFlowCookies(c);
    const retryParams = extensionOAuthSource ? "&source=extension" : "";
    return c.redirect(
      `/login?error=${mapAuthErrorToRedirectToken(error)}${retryParams}`,
    );
  }
  const sessionCookieOptions = {
    ...cookieRequestOptions(c),
    sameSite: extensionOAuthSource ? ("None" as const) : undefined,
  };
  c.header(
    "Set-Cookie",
    buildSetCookie({
      name: SESSION_COOKIE_NAME,
      value: result.sessionId,
      maxAge: SESSION_MAX_AGE_SECONDS,
      expires: result.expiresAt,
      ...sessionCookieOptions,
    }),
    { append: true },
  );
  clearOAuthFlowCookies(c);

  return c.redirect("/dashboard");
});

app.post("/__test__/auth/session", async (c) => {
  const testAuthEnabled = c.env.TEST_AUTH_ENABLED === "1";
  const nonProductionMode = c.env.DEV === "1" || c.env.INSECURE_COOKIES === "1";
  if (!testAuthEnabled || !nonProductionMode) {
    return c.text("Not found", 404);
  }

  let body: { email?: unknown; name?: unknown; sub?: unknown };
  try {
    body = await c.req.json();
  } catch {
    return c.text("Invalid JSON body", 400);
  }

  console.info("[test-auth] Creating test session", {
    sub: typeof body.sub === "string" ? body.sub : "(default)",
    email: typeof body.email === "string" ? body.email : "(default)",
  });

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
