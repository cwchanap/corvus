import { Hono } from "hono";
import { cors } from "hono/cors";
import authLoginRoutes from "./routes/auth/login";
import authLogoutRoutes from "./routes/auth/logout";
import authRegisterRoutes from "./routes/auth/register";
import wishlistRoutes from "./routes/wishlist/index";
import wishlistItemsRoutes from "./routes/wishlist/items/index";
import wishlistItemRoutes from "./routes/wishlist/items/[id]";

const app = new Hono();

// Enable CORS for all routes
app.use(
  "*",
  cors({
    origin: (origin) => {
      // Allow requests from localhost on common development ports
      if (!origin || origin.startsWith("http://localhost:")) {
        return origin || "*";
      }
      return null;
    },
    allowHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
    maxAge: 86400, // 24 hours
  }),
);

// API routes
app.route("/api/auth", authLoginRoutes);
app.route("/api/auth", authLogoutRoutes);
app.route("/api/auth", authRegisterRoutes);
app.route("/api/wishlist", wishlistRoutes);
app.route("/api/wishlist/items", wishlistItemsRoutes);
app.route("/api/wishlist/items", wishlistItemRoutes);

export default app;

// Enable HMR
if (import.meta.hot) {
  import.meta.hot.accept();
}
