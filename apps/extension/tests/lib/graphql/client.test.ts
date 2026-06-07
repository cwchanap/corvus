import { describe, it, expect, vi, beforeEach } from "vitest";
import * as commonClient from "@repo/common/graphql/client";

vi.mock("@repo/common/graphql/client", () => ({
    graphqlRequest: vi.fn(),
}));

const mockedBaseRequest = vi.mocked(commonClient.graphqlRequest);

// Import after mocking to pick up the mock
import {
    graphqlRequest,
    resolveApiBase,
} from "../../../src/lib/graphql/client";

beforeEach(() => {
    vi.clearAllMocks();
});

describe("graphqlRequest (extension client wrapper)", () => {
    it("calls baseGraphqlRequest with the correct endpoint and credentials", async () => {
        mockedBaseRequest.mockResolvedValueOnce({ data: "test" });

        const query = "query { me { id } }";
        await graphqlRequest(query);

        expect(mockedBaseRequest).toHaveBeenCalledWith(
            query,
            undefined,
            expect.objectContaining({
                credentials: "include",
                endpoint: expect.stringContaining("/graphql"),
            }),
        );
    });

    it("passes variables to the base request", async () => {
        mockedBaseRequest.mockResolvedValueOnce({ data: "test" });

        const query = "query GetItem($id: ID!) { item(id: $id) { id } }";
        const variables = { id: "item-1" };
        await graphqlRequest(query, variables);

        expect(mockedBaseRequest).toHaveBeenCalledWith(
            query,
            variables,
            expect.anything(),
        );
    });

    it("merges caller options with default options", async () => {
        mockedBaseRequest.mockResolvedValueOnce({ data: "test" });

        const customFetch = vi.fn();
        await graphqlRequest("query { me { id } }", undefined, {
            fetchImpl: customFetch,
        });

        expect(mockedBaseRequest).toHaveBeenCalledWith(
            expect.any(String),
            undefined,
            expect.objectContaining({
                credentials: "include",
                fetchImpl: customFetch,
            }),
        );
    });

    it("allows caller options to override defaults", async () => {
        mockedBaseRequest.mockResolvedValueOnce({ data: "test" });

        await graphqlRequest("query { me { id } }", undefined, {
            credentials: "omit",
            endpoint: "https://custom-api.example.com/graphql",
        });

        expect(mockedBaseRequest).toHaveBeenCalledWith(
            expect.any(String),
            undefined,
            expect.objectContaining({
                credentials: "omit",
                endpoint: "https://custom-api.example.com/graphql",
            }),
        );
    });

    it("returns the result from baseGraphqlRequest", async () => {
        const mockResult = { me: { id: "user-1", email: "test@example.com" } };
        mockedBaseRequest.mockResolvedValueOnce(mockResult);

        const result = await graphqlRequest<typeof mockResult>(
            "query { me { id } }",
        );

        expect(result).toEqual(mockResult);
    });

    it("propagates errors from baseGraphqlRequest", async () => {
        mockedBaseRequest.mockRejectedValueOnce(new Error("Network failure"));

        await expect(graphqlRequest("query { me { id } }")).rejects.toThrow(
            "Network failure",
        );
    });

    it("uses a /graphql endpoint by default", async () => {
        mockedBaseRequest.mockResolvedValueOnce({});

        await graphqlRequest("query { me { id } }");

        expect(mockedBaseRequest).toHaveBeenCalledWith(
            expect.any(String),
            undefined,
            expect.objectContaining({
                endpoint: expect.stringContaining("/graphql"),
            }),
        );
    });
});

describe("resolveApiBase", () => {
    it("returns the explicit VITE_API_BASE when set", () => {
        expect(
            resolveApiBase({
                VITE_API_BASE: "https://staging.example.com",
                MODE: "production",
            }),
        ).toBe("https://staging.example.com");
    });

    it("treats an empty VITE_API_BASE as unset (falls through to mode logic)", () => {
        expect(resolveApiBase({ VITE_API_BASE: "", MODE: "development" })).toBe(
            "http://localhost:5002",
        );
    });

    it("uses the dev API port in development mode when VITE_API_BASE is unset", () => {
        // Locks the dev port to match apps/api/wrangler.jsonc dev.port (5002).
        expect(resolveApiBase({ MODE: "development" })).toBe(
            "http://localhost:5002",
        );
    });

    it("falls back to the production host when MODE is explicitly production", () => {
        expect(resolveApiBase({ MODE: "production" })).toBe(
            "https://corvus.cwchanap.dev",
        );
    });

    it("fails safe toward localhost when MODE is unset", () => {
        // Inverted default: only explicit "production" targets prod. An unset MODE
        // must never silently route traffic to production.
        expect(resolveApiBase({})).toBe("http://localhost:5002");
    });

    it("fails safe toward localhost for unexpected modes (not production)", () => {
        expect(resolveApiBase({ MODE: "test" })).toBe("http://localhost:5002");
        expect(resolveApiBase({ MODE: "staging" })).toBe(
            "http://localhost:5002",
        );
        expect(resolveApiBase({ MODE: "developmnt" })).toBe(
            "http://localhost:5002",
        );
    });

    it("VITE_API_BASE takes precedence over the production host", () => {
        expect(
            resolveApiBase({
                VITE_API_BASE: "https://custom.example.com",
                MODE: "production",
            }),
        ).toBe("https://custom.example.com");
    });
});
