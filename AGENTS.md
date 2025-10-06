# Repository Guidelines

## Project Structure & Module Organization

Corvus is a pnpm-managed Turborepo. Feature code lives under `apps/`: `apps/web` is the SolidStart client, `apps/extension` is the WXT-powered browser extension, and `apps/api` holds the Cloudflare Worker plus Drizzle migrations. Shared logic, UI primitives, and tooling live in `packages/` (`@repo/common`, `@repo/ui-components`, lint and TS configs). Tests for the web app sit in `apps/web/tests`; place extension specs beside the feature in `apps/extension/src/__tests__` when adding them.

## Build, Test, and Development Commands

Run `pnpm install` once per clone (Node >=18). Use `pnpm dev` for the full stack (web, extension, API helpers) or scope development with `pnpm dev:web` / `pnpm dev:extension`. Build everything with `pnpm build`; filter targets via `pnpm turbo run build --filter=web`. Lint with `pnpm lint`, fixable issues via `pnpm lint:fix`, format using `pnpm format`, and enforce type safety with `pnpm check-types`. Execute UI tests with `pnpm -C apps/web test` or open the Playwright runner using `pnpm -C apps/web test:ui`.

## Coding Style & Naming Conventions

All code is TypeScript. Prettier (3.x) standardizes two-space indentation, semicolons off, and double quotes; run it before committing. ESLint extends the shared `@repo/eslint-config` plus Solid and Turbo plugins--resolve warnings before merging. Use PascalCase for Solid components, camelCase for helpers, and SCREAMING_SNAKE_CASE for constants. Colocate component styles in `.css` or `.tsx` siblings, matching the lowercase file-name pattern in `packages/ui-components`.

## Testing Guidelines

Primary UI coverage relies on Playwright (`apps/web/tests`). Name specs `{feature}.spec.ts` and keep fixtures in `apps/web/tests/fixtures`. Extend API testing with Hono's test client when adding endpoints; store them under `apps/api/tests` and wire them into a future `test` script. Run smoke tests locally before pushing and capture failing screenshots from Playwright in PRs when relevant.

## Commit & Pull Request Guidelines

Commits must satisfy Conventional Commits (`feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`). Use present-tense imperatives and keep scope narrow (e.g. `feat(web): add workspace board filter`). PRs should include a short summary, linked Jira/GitHub issue, screenshots for UI change, and call out any new env vars. Request review from a domain owner (web, extension, or API) and wait for green lint/type checks before merging.
