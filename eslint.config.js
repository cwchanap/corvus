import { config } from "@repo/eslint-config/base";

export default [
  ...config,
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/.turbo/**",
      "**/.output/**",
      "**/.wxt/**",
      "**/.vinxi/**",
      "**/src/graphql/types.ts", // Generated GraphQL types
    ],
  },
];
