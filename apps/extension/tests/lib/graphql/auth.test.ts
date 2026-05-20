import { describe, it, expect, vi } from "vitest";
import { getCurrentUser, logout } from "../../../src/lib/graphql/auth";
import * as extClient from "../../../src/lib/graphql/client";
import {
    ME_QUERY,
    LOGOUT_MUTATION,
} from "@repo/common/graphql/operations/auth";

vi.mock("../../../src/lib/graphql/client", () => ({
    graphqlRequest: vi.fn(),
}));

const mockedRequest = vi.mocked(extClient.graphqlRequest);

const mockUser = {
    id: "user-1",
    email: "alice@example.com",
    name: "Alice",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-02T00:00:00Z",
};

describe("getCurrentUser", () => {
    it("returns user when authenticated", async () => {
        mockedRequest.mockResolvedValueOnce({ me: mockUser });

        const result = await getCurrentUser();

        expect(result).toEqual(mockUser);
        expect(mockedRequest).toHaveBeenCalledWith(ME_QUERY);
    });

    it("returns null when unauthenticated", async () => {
        mockedRequest.mockResolvedValueOnce({ me: null });

        const result = await getCurrentUser();

        expect(result).toBeNull();
    });

    it("propagates errors from graphqlRequest", async () => {
        mockedRequest.mockRejectedValueOnce(new Error("Network error"));

        await expect(getCurrentUser()).rejects.toThrow("Network error");
    });
});

describe("logout", () => {
    it("returns true on successful logout", async () => {
        mockedRequest.mockResolvedValueOnce({ logout: true });

        const result = await logout();

        expect(result).toBe(true);
        expect(mockedRequest).toHaveBeenCalledWith(LOGOUT_MUTATION);
    });

    it("returns false when logout fails", async () => {
        mockedRequest.mockResolvedValueOnce({ logout: false });

        const result = await logout();

        expect(result).toBe(false);
    });

    it("propagates errors from graphqlRequest", async () => {
        mockedRequest.mockRejectedValueOnce(new Error("Session expired"));

        await expect(logout()).rejects.toThrow("Session expired");
    });
});
