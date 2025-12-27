# Repository Guidelines

## Project Structure & Module Organization

- Corvus is a Bun-managed Turborepo. Feature apps live in `apps/`: `apps/web` (SolidStart client), `apps/extension` (WXT browser extension), and `apps/api` (Cloudflare Worker plus Drizzle migrations).
- Shared logic and tooling sit under `packages/` (e.g., `@repo/common`, `@repo/ui-components`, shared configs). Treat these as the source of truth for cross-project utilities.
- Tests reside with their owning targets: Playwright specs in `apps/web/tests`, extension specs beside code under `apps/extension/src/__tests__`, and API tests under `apps/api/tests`.

## Build, Test, and Development Commands

- `bun install` sets up dependencies (Bun 1.1+ required).
- `bun dev` runs the full stack; scope with `bun dev:web` or `bun dev:extension` for faster iteration.
- `bun build` compiles every target; narrow scope via `bun run turbo build --filter=web`.
- `bun lint`, `bun lint:fix`, `bun format`, and `bun check-types` enforce lint, formatting, and type safety. Run them before pushing.
- UI tests use Playwright: `bun --cwd packages/e2e test` (headless) or `bun --cwd packages/e2e test:ui` (interactive).

## Coding Style & Naming Conventions

- All code is TypeScript with two-space indentation, double quotes, and no semicolons. Run `bun format` (Prettier 3.x) to enforce.
- Components follow PascalCase, helpers camelCase, and constants SCREAMING_SNAKE_CASE. CSS modules in `packages/ui-components` mirror the component file name in lowercase.
- ESLint extends `@repo/eslint-config` plus Solid and Turbo plugins. Resolve warnings before merging.

## Testing Guidelines

- Prefer Playwright for UI coverage; name specs `{feature}.spec.ts` and keep fixtures under `apps/web/tests/fixtures`.
- API endpoints should include Hono client tests in `apps/api/tests`; wire them into forthcoming scripts as needed.
- Smoke-test extension features locally and colocate regression specs in `apps/extension/src/__tests__`.

## Commit & Pull Request Guidelines

- Use Conventional Commits (`feat`, `fix`, `docs`, etc.) with scoped subjects like `feat(web): add workspace board filter`. Keep commits focused and imperative.
- PRs need a clear summary, linked Jira/GitHub issue, and screenshots for UI changes. Call out new env vars (e.g., Cloudflare bindings) and wait for green lint/type jobs.

## Agent Workflow Tips

- Favor `rg` for code search (`rg --files` for discovery) and avoid destructive git commands unless directed.
- In sandboxed sessions, request escalation before running commands that require broader filesystem or network access.
