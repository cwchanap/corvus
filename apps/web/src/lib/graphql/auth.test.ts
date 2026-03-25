import { describe, it, expect, vi, beforeEach } from "vitest";
import { getCurrentUser, register, login, logout } from "./auth";
import * as webClient from "./client";
import {
    ME_QUERY,
    REGISTER_MUTATION,
    LOGIN_MUTATION,
    LOGOUT_MUTATION,
} from "@repo/common/graphql/operations/auth";

vi.mock("./client", () => ({
    graphqlRequest: vi.fn(),
}));

const mockedRequest = vi.mocked(webClient.graphqlRequest);

const mockUser = {
    id: "user-1",
    email: "alice@example.com",
    name: "Alice",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-02T00:00:00Z",
};

describe("getCurrentUser", () => {
    beforeEach(() => vi.clearAllMocks());

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

describe("register", () => {
    beforeEach(() => vi.clearAllMocks());

    it("returns auth payload on successful registration", async () => {
        const mockPayload = { success: true, user: mockUser, error: null };
        mockedRequest.mockResolvedValueOnce({ register: mockPayload });
        const input = {
            email: "alice@example.com",
            password: "secret123",
            name: "Alice",
        };

        const result = await register(input);

        expect(result).toEqual(mockPayload);
        expect(mockedRequest).toHaveBeenCalledWith(REGISTER_MUTATION, {
            input,
        });
    });

    it("returns error payload when email already taken", async () => {
        const failPayload = {
            success: false,
            user: null,
            error: "Email already in use",
        };
        mockedRequest.mockResolvedValueOnce({ register: failPayload });

        const result = await register({
            email: "dup@example.com",
            password: "pw",
            name: "Dup",
        });

        expect(result.success).toBe(false);
        expect(result.error).toBe("Email already in use");
    });

    it("propagates errors from graphqlRequest", async () => {
        mockedRequest.mockRejectedValueOnce(new Error("Service unavailable"));

        await expect(
            register({ email: "a@b.com", password: "pw", name: "A" }),
        ).rejects.toThrow("Service unavailable");
    });
});

describe("login", () => {
    beforeEach(() => vi.clearAllMocks());

    it("returns auth payload on successful login", async () => {
        const mockPayload = { success: true, user: mockUser, error: null };
        mockedRequest.mockResolvedValueOnce({ login: mockPayload });
        const input = { email: "alice@example.com", password: "secret123" };

        const result = await login(input);

        expect(result).toEqual(mockPayload);
        expect(mockedRequest).toHaveBeenCalledWith(LOGIN_MUTATION, { input });
    });

    it("returns error payload for invalid credentials", async () => {
        const failPayload = {
            success: false,
            user: null,
            error: "Invalid credentials",
        };
        mockedRequest.mockResolvedValueOnce({ login: failPayload });

        const result = await login({
            email: "bad@example.com",
            password: "wrong",
        });

        expect(result.success).toBe(false);
        expect(result.error).toBe("Invalid credentials");
    });

    it("propagates errors from graphqlRequest", async () => {
        mockedRequest.mockRejectedValueOnce(new Error("Unauthorized"));

        await expect(
            login({ email: "a@b.com", password: "pw" }),
        ).rejects.toThrow("Unauthorized");
    });
});

describe("logout", () => {
    beforeEach(() => vi.clearAllMocks());

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
