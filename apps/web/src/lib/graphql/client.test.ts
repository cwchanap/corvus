import { describe, it, expect, vi, beforeEach } from "vitest";
import * as commonClient from "@repo/common/graphql/client";

vi.mock("@repo/common/graphql/client", () => ({
    graphqlRequest: vi.fn(),
}));

const mockedBaseRequest = vi.mocked(commonClient.graphqlRequest);

// Import after mocking to pick up the mock
import { graphqlRequest } from "./client";

beforeEach(() => {
    vi.clearAllMocks();
});

describe("graphqlRequest (web client wrapper)", () => {
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
});
