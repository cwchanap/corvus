import { beforeEach, describe, expect, it, vi } from "vitest";
import * as authOps from "../src/graphql/operations/auth";
import {
    getCurrentUser,
    logout,
    ME_QUERY,
    LOGOUT_MUTATION,
} from "../src/graphql/operations/auth";
import * as client from "../src/graphql/client";

vi.mock("../src/graphql/client", () => ({
    graphqlRequest: vi.fn(),
}));

const mockedRequest = vi.mocked(client.graphqlRequest);

describe("auth operation query/mutation strings", () => {
    it("ME_QUERY contains 'Me' operation", () => {
        expect(ME_QUERY).toContain("query Me");
        expect(ME_QUERY).toContain("me {");
    });

    it("LOGOUT_MUTATION contains 'Logout' operation", () => {
        expect(LOGOUT_MUTATION).toContain("mutation Logout");
        expect(LOGOUT_MUTATION).toContain("logout");
    });

    it("does not export password auth operations", () => {
        expect(authOps).not.toHaveProperty("REGISTER_MUTATION");
        expect(authOps).not.toHaveProperty("LOGIN_MUTATION");
        expect(authOps).not.toHaveProperty("register");
        expect(authOps).not.toHaveProperty("login");
    });
});

describe("getCurrentUser", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("returns the user when me is not null", async () => {
        const mockUser = {
            id: "user-1",
            email: "alice@example.com",
            name: "Alice",
            createdAt: "2024-01-01",
            updatedAt: "2024-01-02",
        };
        mockedRequest.mockResolvedValueOnce({ me: mockUser });

        const result = await getCurrentUser();

        expect(result).toEqual(mockUser);
        expect(mockedRequest).toHaveBeenCalledWith(
            ME_QUERY,
            undefined,
            undefined,
        );
    });

    it("returns null when me is null", async () => {
        mockedRequest.mockResolvedValueOnce({ me: null });

        const result = await getCurrentUser();

        expect(result).toBeNull();
    });

    it("passes options through to graphqlRequest", async () => {
        mockedRequest.mockResolvedValueOnce({ me: null });
        const options = { endpoint: "https://custom.example.com/graphql" };

        await getCurrentUser(options);

        expect(mockedRequest).toHaveBeenCalledWith(
            ME_QUERY,
            undefined,
            options,
        );
    });

    it("propagates errors from graphqlRequest", async () => {
        mockedRequest.mockRejectedValueOnce(new Error("Unauthorized"));

        await expect(getCurrentUser()).rejects.toThrow("Unauthorized");
    });
});

describe("logout", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("returns true on successful logout", async () => {
        mockedRequest.mockResolvedValueOnce({ logout: true });

        const result = await logout();

        expect(result).toBe(true);
        expect(mockedRequest).toHaveBeenCalledWith(
            LOGOUT_MUTATION,
            undefined,
            undefined,
        );
    });

    it("returns false when logout fails", async () => {
        mockedRequest.mockResolvedValueOnce({ logout: false });

        const result = await logout();

        expect(result).toBe(false);
    });

    it("passes options to graphqlRequest", async () => {
        mockedRequest.mockResolvedValueOnce({ logout: true });
        const options = { endpoint: "https://api.example.com/graphql" };

        await logout(options);

        expect(mockedRequest).toHaveBeenCalledWith(
            LOGOUT_MUTATION,
            undefined,
            options,
        );
    });

    it("propagates errors from graphqlRequest", async () => {
        mockedRequest.mockRejectedValueOnce(new Error("Session expired"));

        await expect(logout()).rejects.toThrow("Session expired");
    });
});
