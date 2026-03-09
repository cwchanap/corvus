import { requireAuth } from "../../src/lib/auth/session";
import type { PublicUser } from "../../src/lib/db/types";

describe("requireAuth", () => {
    it("returns authenticated user when present", () => {
        const user: PublicUser = {
            id: "user-uuid-123",
            email: "test@example.com",
            name: "Test User",
            created_at: "2024-01-01T00:00:00.000Z",
            updated_at: "2024-01-01T00:00:00.000Z",
        };

        expect(requireAuth(user)).toEqual(user);
    });

    it("throws when user is not authenticated", () => {
        expect(() => requireAuth(null)).toThrowError("Authentication required");
    });
});
