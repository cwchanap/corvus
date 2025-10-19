import { createYoga } from "graphql-yoga";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import type { Context } from "hono";
import { createGraphQLContext } from "./context.js";
import { resolvers } from "./resolvers.js";

// Get the directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read the GraphQL schema
const typeDefs = readFileSync(join(__dirname, "schema.graphql"), "utf-8");

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

    // Forward to Yoga
    const response = await yoga.fetch(request, {
      // Pass Cloudflare env if needed
      env: c.env,
    });

    return response;
  };
};
