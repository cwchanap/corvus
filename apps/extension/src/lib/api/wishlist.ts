import { WishlistApiClient } from "@repo/common/api/wishlist-client";

const envBase =
  (import.meta.env.VITE_API_BASE as string | undefined) ??
  (import.meta.env.MODE === "development" ? "http://localhost:5002" : "");

export const wishlistApi = new WishlistApiClient({
  baseUrl: envBase,
  credentials: "include",
});
