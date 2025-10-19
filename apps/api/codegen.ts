import type { CodegenConfig } from "@graphql-codegen/cli";

const config: CodegenConfig = {
  schema: "./src/graphql/schema.graphql",
  generates: {
    "./src/graphql/types.ts": {
      plugins: ["typescript", "typescript-resolvers"],
      config: {
        useIndexSignature: true,
        contextType: "./context#GraphQLContext",
        mappers: {
          User: "../lib/db/types#PublicUser",
          WishlistCategory: "../lib/db/types#WishlistCategory",
          WishlistItem: "../lib/db/types#WishlistItem",
          WishlistItemLink: "../lib/db/types#WishlistItemLink",
        },
      },
    },
  },
};

export default config;
