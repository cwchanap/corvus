import type { CodegenConfig } from "@graphql-codegen/cli";

const config: CodegenConfig = {
  schema: "./src/graphql/schema.graphql",
  generates: {
    "./src/graphql/types.ts": {
      plugins: ["typescript", "typescript-resolvers"],
      config: {
        useIndexSignature: true,
        contextType: "./context#GraphQLContext",
        // Map GraphQL types to DB types without importing them
        // This avoids type conflicts by using type aliases in resolvers
        useTypeImports: true,
      },
    },
  },
};

export default config;
