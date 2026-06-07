import { describe, it, expect, vi } from "vitest";
import {
    graphqlRequest,
    GraphQLError,
    isAuthError,
} from "../src/graphql/client";

function makeFetch(
    status: number,
    body: unknown,
    ok = status >= 200 && status < 300,
): typeof fetch {
    return vi.fn().mockResolvedValue({
        ok,
        status,
        json: vi.fn().mockResolvedValue(body),
    }) as unknown as typeof fetch;
}

describe("graphqlRequest", () => {
    it("returns data on a successful response", async () => {
        const fetchImpl = makeFetch(200, { data: { hello: "world" } });
        const result = await graphqlRequest<{ hello: string }>(
            "{ hello }",
            undefined,
            { fetchImpl },
        );
        expect(result).toEqual({ hello: "world" });
    });

    it("passes variables to the request body", async () => {
        const fetchImpl = makeFetch(200, { data: { item: { id: "1" } } });
        await graphqlRequest(
            "query($id: ID!) { item(id: $id) { id } }",
            { id: "1" },
            { fetchImpl },
        );
        const [, init] = (fetchImpl as ReturnType<typeof vi.fn>).mock
            .calls[0] as [string, RequestInit];
        const body = JSON.parse(init.body as string);
        expect(body.variables).toEqual({ id: "1" });
    });

    it("uses the provided endpoint", async () => {
        const fetchImpl = makeFetch(200, { data: {} });
        await graphqlRequest("{ q }", undefined, {
            fetchImpl,
            endpoint: "https://custom.example.com/graphql",
        });
        const [url] = (fetchImpl as ReturnType<typeof vi.fn>).mock.calls[0] as [
            string,
            RequestInit,
        ];
        expect(url).toBe("https://custom.example.com/graphql");
    });

    it("uses the default endpoint when endpoint is not provided", async () => {
        const fetchImpl = makeFetch(200, { data: {} });
        await graphqlRequest("{ q }", undefined, { fetchImpl });
        const [url] = (fetchImpl as ReturnType<typeof vi.fn>).mock.calls[0] as [
            string,
            RequestInit,
        ];
        expect(url).toBe("http://localhost:8787/graphql");
    });

    it("sends credentials via the provided option", async () => {
        const fetchImpl = makeFetch(200, { data: {} });
        await graphqlRequest("{ q }", undefined, {
            fetchImpl,
            credentials: "omit",
        });
        const [, init] = (fetchImpl as ReturnType<typeof vi.fn>).mock
            .calls[0] as [string, RequestInit];
        expect(init.credentials).toBe("omit");
    });

    it("throws on a non-ok HTTP response", async () => {
        const fetchImpl = makeFetch(500, {}, false);
        await expect(
            graphqlRequest("{ q }", undefined, { fetchImpl }),
        ).rejects.toThrow("HTTP error! status: 500");
    });

    it("throws when the response contains GraphQL errors", async () => {
        const fetchImpl = makeFetch(200, {
            errors: [{ message: "Forbidden" }],
        });
        await expect(
            graphqlRequest("{ q }", undefined, { fetchImpl }),
        ).rejects.toThrow("Forbidden");
    });

    it("throws when the response has no data", async () => {
        const fetchImpl = makeFetch(200, { errors: [] });
        await expect(
            graphqlRequest("{ q }", undefined, { fetchImpl }),
        ).rejects.toThrow("No data returned from GraphQL query");
    });

    it("uses the global fetch by default (no fetchImpl provided)", async () => {
        // Provide no options at all – exercises the `fetchImpl = fetch` default.
        // We stub globalThis.fetch to avoid real network calls.
        const globalFetch = vi.fn().mockResolvedValue({
            ok: true,
            status: 200,
            json: vi.fn().mockResolvedValue({ data: { ok: true } }),
        });
        const original = globalThis.fetch;
        globalThis.fetch = globalFetch as unknown as typeof fetch;
        try {
            const result = await graphqlRequest<{ ok: boolean }>("{ ok }");
            expect(result).toEqual({ ok: true });
            expect(globalFetch).toHaveBeenCalledOnce();
        } finally {
            globalThis.fetch = original;
        }
    });

    it("throws a GraphQLError carrying the HTTP status on non-ok responses", async () => {
        const fetchImpl = makeFetch(401, {}, false);
        try {
            await graphqlRequest("{ q }", undefined, { fetchImpl });
            throw new Error("should have thrown");
        } catch (err) {
            expect(err).toBeInstanceOf(GraphQLError);
            expect((err as GraphQLError).status).toBe(401);
            expect((err as Error).message).toBe("HTTP error! status: 401");
        }
    });

    it("throws a GraphQLError carrying the extension code on body errors", async () => {
        const fetchImpl = makeFetch(200, {
            errors: [
                {
                    message: "Not authenticated",
                    extensions: { code: "UNAUTHENTICATED" },
                },
            ],
        });
        try {
            await graphqlRequest("{ q }", undefined, { fetchImpl });
            throw new Error("should have thrown");
        } catch (err) {
            expect(err).toBeInstanceOf(GraphQLError);
            expect((err as GraphQLError).code).toBe("UNAUTHENTICATED");
            expect((err as Error).message).toBe("Not authenticated");
        }
    });

    it("omits code when the error extension code is not a string", async () => {
        const fetchImpl = makeFetch(200, {
            errors: [{ message: "Boom", extensions: { code: 123 } }],
        });
        try {
            await graphqlRequest("{ q }", undefined, { fetchImpl });
            throw new Error("should have thrown");
        } catch (err) {
            expect(err).toBeInstanceOf(GraphQLError);
            expect((err as GraphQLError).code).toBeUndefined();
        }
    });
});

describe("GraphQLError", () => {
    it("preserves the message for backwards compatibility", () => {
        const err = new GraphQLError("something broke");
        expect(err.message).toBe("something broke");
        expect(err.name).toBe("GraphQLError");
    });

    it("is an instance of Error", () => {
        const err = new GraphQLError("x");
        expect(err).toBeInstanceOf(Error);
    });

    it("stores status and code when provided", () => {
        const err = new GraphQLError("nope", {
            status: 403,
            code: "FORBIDDEN",
        });
        expect(err.status).toBe(403);
        expect(err.code).toBe("FORBIDDEN");
    });

    it("leaves status and code undefined when not provided", () => {
        const err = new GraphQLError("nope");
        expect(err.status).toBeUndefined();
        expect(err.code).toBeUndefined();
    });
});

describe("isAuthError", () => {
    it("returns true for HTTP 401 GraphQLError", () => {
        expect(
            isAuthError(
                new GraphQLError("HTTP error! status: 401", { status: 401 }),
            ),
        ).toBe(true);
    });

    it("returns true for HTTP 403 GraphQLError", () => {
        expect(
            isAuthError(
                new GraphQLError("HTTP error! status: 403", { status: 403 }),
            ),
        ).toBe(true);
    });

    it("returns true for UNAUTHENTICATED extension code", () => {
        expect(
            isAuthError(
                new GraphQLError("Not authenticated", {
                    code: "UNAUTHENTICATED",
                }),
            ),
        ).toBe(true);
    });

    it("returns true for UNAUTHORIZED extension code", () => {
        expect(
            isAuthError(
                new GraphQLError("Not authorized", { code: "UNAUTHORIZED" }),
            ),
        ).toBe(true);
    });

    it("returns false for a 500 GraphQLError", () => {
        expect(
            isAuthError(
                new GraphQLError("HTTP error! status: 500", { status: 500 }),
            ),
        ).toBe(false);
    });

    it("returns false for a GraphQLError without auth-related status or code", () => {
        expect(isAuthError(new GraphQLError("Item not found"))).toBe(false);
    });

    it("returns false for a plain Error (not a GraphQLError)", () => {
        expect(isAuthError(new Error("Not authenticated"))).toBe(false);
    });

    it("returns false for non-Error values", () => {
        expect(isAuthError(null)).toBe(false);
        expect(isAuthError(undefined)).toBe(false);
        expect(isAuthError("Not authenticated")).toBe(false);
        expect(isAuthError({ status: 401 })).toBe(false);
    });
});
