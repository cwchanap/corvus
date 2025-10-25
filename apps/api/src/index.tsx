import type { D1Database, Fetcher } from "@cloudflare/workers-types";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { createGraphQLHandler } from "./graphql/handler.js";

type AppBindings = {
  DB: D1Database;
  ASSETS: Fetcher;
  DEV?: string;
};

const app = new Hono<{ Bindings: AppBindings }>();

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

// GraphQL endpoint - API is now GraphQL-only
app.all("/graphql", createGraphQLHandler());

// Catch-all for serving static assets (web app)
app.get("*", async (c) => {
  const assetResponse = await c.env.ASSETS.fetch(c.req.raw);

  if (assetResponse.status === 404) {
    const acceptHeader = c.req.header("accept") ?? "";

    if (acceptHeader.includes("text/html")) {
      const fallbackUrl = new URL("/index.html", c.req.url);
      const fallbackRequest = new Request(fallbackUrl, {
        method: "GET",
        headers: c.req.raw.headers,
      });

      const fallbackResponse = await c.env.ASSETS.fetch(fallbackRequest);

      if (fallbackResponse.status !== 404) {
        return fallbackResponse;
      }
    }
  }

  return assetResponse;
});

export default app;

// Enable HMR
if (import.meta.hot) {
  import.meta.hot.accept();
}
