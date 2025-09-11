import { Hono } from "hono";
import { cors } from "hono/cors";
import authLoginRoutes from "./routes/auth/login";
import authLogoutRoutes from "./routes/auth/logout";
import wishlistRoutes from "./routes/wishlist/index";
import wishlistItemsRoutes from "./routes/wishlist/items/index";
import wishlistItemRoutes from "./routes/wishlist/items/[id]";

const app = new Hono();

// Enable CORS for all routes
app.use(
  "*",
  cors({
    origin: ["http://localhost:5000", "http://localhost:3000"],
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  }),
);

// API routes
app.route("/api/auth", authLoginRoutes);
app.route("/api/auth", authLogoutRoutes);
app.route("/api/wishlist", wishlistRoutes);
app.route("/api/wishlist/items", wishlistItemsRoutes);
app.route("/api/wishlist/items", wishlistItemRoutes);

export default app;
