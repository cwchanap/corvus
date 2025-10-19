import type { D1Database, Fetcher } from "@cloudflare/workers-types";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { createGraphQLHandler } from "./graphql/handler.js";
import authLoginRoutes from "./routes/auth/login";
import authLogoutRoutes from "./routes/auth/logout";
import authRegisterRoutes from "./routes/auth/register";
import authMeRoutes from "./routes/auth/me";
import wishlistRoutes from "./routes/wishlist/index";
import wishlistItemsRoutes from "./routes/wishlist/items/index";
import wishlistItemRoutes from "./routes/wishlist/items/[id]";
import wishlistItemLinksRoutes from "./routes/wishlist/items/links";
import wishlistCategoriesRoutes from "./routes/wishlist/categories/index";

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

// GraphQL endpoint
app.use("/graphql", createGraphQLHandler());

// API routes
app.route("/api/auth", authLoginRoutes);
app.route("/api/auth", authLogoutRoutes);
app.route("/api/auth", authRegisterRoutes);
app.route("/api/auth", authMeRoutes);
app.route("/api/wishlist", wishlistRoutes);
app.route("/api/wishlist/categories", wishlistCategoriesRoutes);
app.route("/api/wishlist/items", wishlistItemsRoutes);
app.route("/api/wishlist/items", wishlistItemRoutes);
app.route("/api/wishlist/items", wishlistItemLinksRoutes);
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
