import { createYoga } from "graphql-yoga";
import { makeExecutableSchema } from "@graphql-tools/schema";
import type { Context } from "hono";
import { createGraphQLContext } from "./context.js";
import { resolvers } from "./resolvers.js";
import typeDefs from "./schema.graphql?raw";

// Build the executable schema with resolvers
const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
});

/**
 * Create the GraphQL Yoga instance
 */
const yoga = createYoga({
  schema,
  graphiql: true,
  context: async ({ request }) => {
    // Extract Hono context from request (passed via middleware)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const honoContext = (request as any).__honoContext as Context;
    return await createGraphQLContext(honoContext);
  },
});

/**
 * Create the GraphQL handler middleware for Hono
 * Wraps GraphQL Yoga to work with Hono
 */
export const createGraphQLHandler = () => {
  return async (c: Context) => {
    // Attach Hono context to request for later retrieval
    const request = c.req.raw;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (request as any).__honoContext = c;

    // Forward to Yoga and get the response
    const yogaResponse = await yoga.fetch(request, {
      // Pass Cloudflare env if needed
      env: c.env,
    });

    // Read the response body as text to avoid ReadableStream serialization issues
    const body = await yogaResponse.text();

    // Copy headers from Yoga response
    const headers = new Headers(yogaResponse.headers);

    // Copy any headers set on the Hono context (e.g., Set-Cookie from auth mutations)
    c.res.headers.forEach((value, key) => {
      if (key.toLowerCase() === "set-cookie") {
        headers.append(key, value);
      } else if (!headers.has(key)) {
        headers.set(key, value);
      }
    });

    // Return a new response with the text body
    return new Response(body, {
      status: yogaResponse.status,
      statusText: yogaResponse.statusText,
      headers,
    });
  };
};
