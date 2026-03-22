import { describe, it, expect, vi } from "vitest";
import { graphqlRequest } from "../src/graphql/client";

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

    it("uses the default endpoint when no options supplied", async () => {
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
});
