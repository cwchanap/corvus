# Repository Guidelines

## Project Structure & Module Organization

- Root: PNPM + Turborepo monorepo (`pnpm-workspace.yaml`, `turbo.json`).
- Apps: `apps/web` (SolidStart web app), `apps/extension` (WXT browser extension).
- Packages: `packages/common` (shared utils/types), `packages/ui-components` (Solid UI), `packages/eslint-config`, `packages/typescript-config`.
- Tests: end-to-end tests live in `apps/web/tests` (Playwright). Build artifacts are ignored under `.wxt/`, `.vinxi/`, `.output/`, `dist/`.

## Build, Test, and Development Commands

- From root
  - `pnpm build`: Turbo builds all packages/apps.
  - `pnpm dev:web` / `pnpm dev:extension`: Run the web app or extension in dev mode via Turbo filters.
  - `pnpm lint` / `pnpm lint:fix`: Lint across the monorepo, optionally fixing issues.
  - `pnpm check-types`: Run TypeScript checks.
  - `pnpm format`: Prettier format for `ts/tsx/md`.
- App-specific (examples)
  - Web: `pnpm --filter web dev`, `pnpm --filter web test` (Playwright), `pnpm --filter web build`.
  - Extension: `pnpm --filter extension dev`, `pnpm --filter extension build`, `pnpm --filter extension zip`.

## Coding Style & Naming Conventions

- Language: TypeScript throughout.
- Linting/Formatting: ESLint (`@repo/eslint-config`) and Prettier. Pre-commit runs lint-staged; CI rejects warnings in app packages.
- Indentation/Style: Prettier defaults (2 spaces, semicolons off by config defaults). Keep imports sorted logically.
- Naming: components `PascalCase`, functions/vars `camelCase`, constants `UPPER_SNAKE_CASE`, files/dirs `kebab-case`.

## Testing Guidelines

- Framework: Playwright E2E in `apps/web/tests`.
- Run: `pnpm --filter web test` (CLI) or `pnpm --filter web test:ui` for the UI runner.
- Conventions: name tests `*.test.ts`; group by feature; prefer stable selectors and data attributes.

## E2E Test Account (Local/Dev Only)

Email: pwtester.20250808.001@example.com
Password: Password123!

Notes:

- For local/dev testing only. Do not use in production.
- If the local DB is reset, recreate this account via the app's sign-up flow.

## Commit & Pull Request Guidelines

- Conventional Commits enforced via Commitlint/Husky (e.g., `feat: add wishlist drag-and-drop`).
- Pre-commit: `lint-staged` runs ESLint/Prettier; fix before committing.
- PRs: include clear description, linked issue, and screenshots/video for UI changes. Ensure `build`, `lint`, `check-types`, and tests pass.

## Security & Configuration Tips

- Never commit secrets. Use `apps/web/.dev.vars` (see `.dev.vars.example`) and `wrangler.toml` for local Cloudflare D1.
- DB: Initialize via `pnpm --filter web setup-db` or `db:local`/`db:remote` scripts as needed.
