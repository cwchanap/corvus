import { config as base } from "@repo/eslint-config/base";

// Extend base config to ignore generated artifacts in this app
const overrides = [
  {
    ignores: [
      ".wrangler/**", // Wrangler Pages/Workers temp output
      ".turbo/**", // Turbo cache
    ],
  },
];

export default [...base, ...overrides];
