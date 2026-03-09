import type { PublicUser } from "../db/types";

export function requireAuth(user: PublicUser | null): PublicUser {
    if (!user) {
        throw new Error("Authentication required");
    }
    return user;
}
