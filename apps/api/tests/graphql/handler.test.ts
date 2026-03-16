import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Context } from "hono";

// vi.hoisted ensures these are available when mock factories run (before imports)
const { mockYogaFetch, capturedYogaArgs } = vi.hoisted(() => {
    const args: unknown[] = [];
    return {
        mockYogaFetch: vi.fn(),
        capturedYogaArgs: args,
    };
});

vi.mock("graphql-yoga", () => ({
    // Capture options in a plain array so vi.clearAllMocks() won't erase them
    createYoga: vi.fn((options: unknown) => {
        capturedYogaArgs.push(options);
        return { fetch: mockYogaFetch };
    }),
}));

vi.mock("@graphql-tools/schema", () => ({
    makeExecutableSchema: vi.fn(() => ({})),
}));

vi.mock("../../src/graphql/schema.graphql", () => ({
    default: `type Query { _empty: String }`,
}));

vi.mock("../../src/graphql/resolvers", () => ({ resolvers: {} }));

vi.mock("../../src/graphql/context", () => ({
    createGraphQLContext: vi.fn().mockResolvedValue({}),
}));

import { createGraphQLContext } from "../../src/graphql/context";
import { createGraphQLHandler } from "../../src/graphql/handler";

function createMockHonoContext(resHeaders?: Headers): Context {
    return {
        req: {
            raw: new Request("https://example.com/graphql", { method: "POST" }),
        },
        res: {
            headers: resHeaders ?? new Headers(),
        },
        env: { DB: "mock-binding" },
    } as unknown as Context;
}

describe("createGraphQLHandler", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("returns a handler function", () => {
        const handler = createGraphQLHandler();
        expect(typeof handler).toBe("function");
    });

    it("attaches honoContext to the request and forwards to yoga", async () => {
        const yogaResponse = new Response(
            JSON.stringify({ data: { test: true } }),
            {
                status: 200,
                statusText: "OK",
                headers: new Headers({ "content-type": "application/json" }),
            },
        );
        mockYogaFetch.mockResolvedValue(yogaResponse);

        const honoContext = createMockHonoContext();
        const handler = createGraphQLHandler();
        await handler(honoContext);

        // Verify __honoContext was attached to the raw request
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect((honoContext.req.raw as any).__honoContext).toBe(honoContext);

        // Verify yoga.fetch was called with the modified request and env
        expect(mockYogaFetch).toHaveBeenCalledWith(honoContext.req.raw, {
            env: honoContext.env,
        });
    });

    it("returns a response with the yoga response body and status", async () => {
        const responseBody = JSON.stringify({ data: { items: [] } });
        const yogaResponse = new Response(responseBody, {
            status: 200,
            statusText: "OK",
            headers: new Headers({ "content-type": "application/json" }),
        });
        mockYogaFetch.mockResolvedValue(yogaResponse);

        const honoContext = createMockHonoContext();
        const handler = createGraphQLHandler();
        const response = await handler(honoContext);

        expect(response.status).toBe(200);
        expect(response.statusText).toBe("OK");
        expect(await response.text()).toBe(responseBody);
    });

    it("preserves error status codes from yoga response", async () => {
        const yogaResponse = new Response("Bad Request", {
            status: 400,
            statusText: "Bad Request",
            headers: new Headers(),
        });
        mockYogaFetch.mockResolvedValue(yogaResponse);

        const honoContext = createMockHonoContext();
        const handler = createGraphQLHandler();
        const response = await handler(honoContext);

        expect(response.status).toBe(400);
        expect(response.statusText).toBe("Bad Request");
    });

    it("copies headers from yoga response into the returned response", async () => {
        const yogaResponse = new Response("body", {
            status: 200,
            statusText: "OK",
            headers: new Headers({
                "content-type": "application/json",
                "x-request-id": "req-123",
            }),
        });
        mockYogaFetch.mockResolvedValue(yogaResponse);

        const honoContext = createMockHonoContext();
        const handler = createGraphQLHandler();
        const response = await handler(honoContext);

        expect(response.headers.get("content-type")).toBe("application/json");
        expect(response.headers.get("x-request-id")).toBe("req-123");
    });

    it("appends Set-Cookie headers from Hono context to the response", async () => {
        const yogaResponse = new Response("body", {
            status: 200,
            statusText: "OK",
            headers: new Headers({ "content-type": "application/json" }),
        });
        mockYogaFetch.mockResolvedValue(yogaResponse);

        const resHeaders = new Headers();
        resHeaders.append("set-cookie", "session=abc; Path=/; HttpOnly");
        resHeaders.append("set-cookie", "token=xyz; Path=/");
        const honoContext = createMockHonoContext(resHeaders);

        const handler = createGraphQLHandler();
        const response = await handler(honoContext);

        // Both Set-Cookie headers should be present
        const setCookieHeader = response.headers.get("set-cookie");
        expect(setCookieHeader).toBeTruthy();
        // The combined header value should contain both cookies
        const cookieValues =
            response.headers.getSetCookie?.() ??
            (setCookieHeader ? [setCookieHeader] : []);
        const cookieString = cookieValues.join(", ");
        expect(cookieString).toContain("session=abc");
        expect(cookieString).toContain("token=xyz");
    });

    it("adds non-Set-Cookie Hono context headers to response if not already present", async () => {
        const yogaResponse = new Response("body", {
            status: 200,
            statusText: "OK",
            headers: new Headers({ "content-type": "application/json" }),
        });
        mockYogaFetch.mockResolvedValue(yogaResponse);

        const resHeaders = new Headers();
        resHeaders.set("x-custom-header", "custom-value");
        const honoContext = createMockHonoContext(resHeaders);

        const handler = createGraphQLHandler();
        const response = await handler(honoContext);

        expect(response.headers.get("x-custom-header")).toBe("custom-value");
    });

    it("yoga context factory extracts __honoContext and calls createGraphQLContext", async () => {
        // Covers lines 23-25: the context factory passed to createYoga
        // capturedYogaArgs is a plain array, not cleared by vi.clearAllMocks()
        const yogaOptions = capturedYogaArgs[0] as {
            context: (opts: { request: Request }) => Promise<unknown>;
        };
        expect(typeof yogaOptions.context).toBe("function");

        const mockRequest = new Request("https://example.com/graphql");
        const mockHonoContext = createMockHonoContext();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (mockRequest as any).__honoContext = mockHonoContext;

        (createGraphQLContext as ReturnType<typeof vi.fn>).mockResolvedValue({
            user: null,
        });

        await yogaOptions.context({ request: mockRequest });

        expect(createGraphQLContext).toHaveBeenCalledWith(mockHonoContext);
    });

    it("does not overwrite yoga response headers with Hono context headers", async () => {
        const yogaResponse = new Response("body", {
            status: 200,
            statusText: "OK",
            headers: new Headers({
                "content-type": "application/json; charset=utf-8",
            }),
        });
        mockYogaFetch.mockResolvedValue(yogaResponse);

        const resHeaders = new Headers();
        resHeaders.set("content-type", "text/plain");
        const honoContext = createMockHonoContext(resHeaders);

        const handler = createGraphQLHandler();
        const response = await handler(honoContext);

        // yoga's content-type should win over Hono's
        expect(response.headers.get("content-type")).toBe(
            "application/json; charset=utf-8",
        );
    });
});
