import { describe, it, expect, vi, beforeEach } from "vitest";
import {
    getCurrentUser,
    register,
    login,
    logout,
    ME_QUERY,
    REGISTER_MUTATION,
    LOGIN_MUTATION,
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

    it("REGISTER_MUTATION contains 'Register' operation", () => {
        expect(REGISTER_MUTATION).toContain("mutation Register");
        expect(REGISTER_MUTATION).toContain("register(input:");
    });

    it("LOGIN_MUTATION contains 'Login' operation", () => {
        expect(LOGIN_MUTATION).toContain("mutation Login");
        expect(LOGIN_MUTATION).toContain("login(input:");
    });

    it("LOGOUT_MUTATION contains 'Logout' operation", () => {
        expect(LOGOUT_MUTATION).toContain("mutation Logout");
        expect(LOGOUT_MUTATION).toContain("logout");
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

describe("register", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("returns auth payload on successful registration", async () => {
        const mockPayload = {
            success: true,
            user: {
                id: "user-2",
                email: "bob@example.com",
                name: "Bob",
                createdAt: "2024-02-01",
                updatedAt: "2024-02-02",
            },
            error: null,
        };
        mockedRequest.mockResolvedValueOnce({ register: mockPayload });
        const input = {
            email: "bob@example.com",
            password: "pass123",
            name: "Bob",
        };

        const result = await register(input);

        expect(result).toEqual(mockPayload);
        expect(mockedRequest).toHaveBeenCalledWith(
            REGISTER_MUTATION,
            { input },
            undefined,
        );
    });

    it("returns failed payload when registration fails", async () => {
        const failPayload = {
            success: false,
            user: null,
            error: "Email already in use",
        };
        mockedRequest.mockResolvedValueOnce({ register: failPayload });

        const result = await register({
            email: "dup@example.com",
            password: "x",
            name: "Dup",
        });

        expect(result.success).toBe(false);
        expect(result.error).toBe("Email already in use");
    });

    it("passes options to graphqlRequest", async () => {
        mockedRequest.mockResolvedValueOnce({
            register: { success: true, user: null, error: null },
        });
        const options = { endpoint: "https://other.example.com/graphql" };
        const input = { email: "c@example.com", password: "pw", name: "C" };

        await register(input, options);

        expect(mockedRequest).toHaveBeenCalledWith(
            REGISTER_MUTATION,
            { input },
            options,
        );
    });

    it("propagates errors from graphqlRequest", async () => {
        mockedRequest.mockRejectedValueOnce(new Error("Network error"));

        await expect(
            register({ email: "a@b.com", password: "pw", name: "A" }),
        ).rejects.toThrow("Network error");
    });
});

describe("login", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("returns auth payload on successful login", async () => {
        const mockPayload = {
            success: true,
            user: {
                id: "user-3",
                email: "carol@example.com",
                name: "Carol",
                createdAt: "2024-03-01",
                updatedAt: "2024-03-02",
            },
            error: null,
        };
        mockedRequest.mockResolvedValueOnce({ login: mockPayload });
        const input = { email: "carol@example.com", password: "secret" };

        const result = await login(input);

        expect(result).toEqual(mockPayload);
        expect(mockedRequest).toHaveBeenCalledWith(
            LOGIN_MUTATION,
            { input },
            undefined,
        );
    });

    it("returns failed payload for invalid credentials", async () => {
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

    it("passes options to graphqlRequest", async () => {
        mockedRequest.mockResolvedValueOnce({
            login: { success: true, user: null, error: null },
        });
        const options = { credentials: "omit" as const };
        const input = { email: "x@example.com", password: "pw" };

        await login(input, options);

        expect(mockedRequest).toHaveBeenCalledWith(
            LOGIN_MUTATION,
            { input },
            options,
        );
    });

    it("propagates errors from graphqlRequest", async () => {
        mockedRequest.mockRejectedValueOnce(new Error("Service unavailable"));

        await expect(
            login({ email: "a@b.com", password: "pw" }),
        ).rejects.toThrow("Service unavailable");
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
