<!--
Sync Impact Report:
Version: 1.0.0 (Initial ratification)
Modified Principles: N/A (new constitution)
Added Sections:
  - Core Principles (7 principles)
  - Technology Stack Constraints
  - Development Workflow
  - Governance
Templates Status:
  ✅ plan-template.md - Verified (Constitution Check section aligns)
  ✅ spec-template.md - Verified (User story priority structure compatible)
  ✅ tasks-template.md - Verified (Phase-based approach aligns with principles)
Follow-up TODOs: None
-->

# Corvus Constitution

## Core Principles

### I. Monorepo Architecture (NON-NEGOTIABLE)

**Rule**: All applications and packages MUST reside in a Turborepo monorepo with clear
separation: apps in `apps/` (web, extension, api) and shared code in `packages/`
(@repo/ui-components, @repo/common, @repo/\*-config).

**Rationale**: Ensures code reusability, consistent tooling, atomic cross-package changes,
and centralized dependency management. The monorepo structure enables shared UI components
and types across web app, browser extension, and API without duplication.

### II. TypeScript & SolidJS First

**Rule**: All code MUST be TypeScript with strict mode enabled. UI components MUST use
SolidJS patterns: `splitProps()` for prop separation, class-variance-authority (cva) for
styling, and proper interface exports (`ComponentProps<T>`).

**Rationale**: TypeScript strict mode catches errors at compile time. SolidJS provides
reactive primitives without virtual DOM overhead. Consistent patterns across the codebase
reduce cognitive load and improve maintainability.

### III. Test-Driven Development

**Rule**: UI features MUST have Playwright tests before implementation. Tests MUST be
written, reviewed, fail first, then implementation proceeds. Test files follow
`{feature}.spec.ts` naming and reside with their owning targets (apps/web/tests,
apps/extension/src/**tests**, apps/api/tests).

**Rationale**: Pre-written tests clarify requirements, prevent regressions, and serve as
living documentation. Failing-first ensures tests actually validate behavior rather than
passing vacuously.

### IV. Code Quality Standards (NON-NEGOTIABLE)

**Rules**:

- Two-space indentation, double quotes, no semicolons enforced by Prettier 3.x
- ESLint MUST pass with max 25 warnings (enforced in CI)
- Components: PascalCase, helpers: camelCase, constants: SCREAMING_SNAKE_CASE
- All code MUST pass `pnpm lint`, `pnpm format`, `pnpm check-types` before pushing

**Rationale**: Automated formatting eliminates style debates. Warning limits prevent
quality decay. Naming conventions improve code scanning and comprehension.

### V. Conventional Commits (NON-NEGOTIABLE)

**Rule**: All commits MUST follow Conventional Commits format with scoped subjects:
`<type>(<scope>): <imperative subject>` (e.g., `feat(web): add workspace board filter`).
Types: feat, fix, docs, style, refactor, test, chore. Enforced via commitlint.

**Rationale**: Structured commits enable automated changelog generation, semantic
versioning, and clear git history for debugging and auditing.

### VI. Shared Component Libraries

**Rule**: Reusable UI components MUST live in `@repo/ui-components` with Tailwind + CVA.
Shared types and utilities MUST live in `@repo/common`. Export structure defined in
`package.json` exports field. NO duplication across apps.

**Rationale**: Single source of truth for components and types reduces bugs from
inconsistent implementations. Centralized components enable unified design system updates.

### VII. Cloudflare-First Deployment

**Rule**: API MUST deploy to Cloudflare Workers with D1 database bindings
(`wrangler.jsonc`). Web app MUST use `cloudflare-pages` preset in `app.config.ts`.
Environment variables managed through Cloudflare dashboard, NOT committed to repo.

**Rationale**: Cloudflare's edge network provides global low-latency deployment. D1 offers
serverless SQLite at scale. Platform-specific presets optimize bundle size and cold starts.

## Technology Stack Constraints

**Language**: TypeScript 5.8.3 with strict mode (REQUIRED)  
**Package Manager**: pnpm 9.0.0 with workspace protocol (REQUIRED)  
**Node Version**: >=18 (REQUIRED)  
**Build System**: Turborepo 2.5+ for parallel task execution (REQUIRED)  
**Frameworks**:

- Web: SolidStart with Better Auth (session-based)
- Extension: WXT (Manifest v3) with SolidJS popup interface
- API: Hono + Drizzle ORM with D1 database

**Styling**: Tailwind CSS + class-variance-authority (cva) patterns (REQUIRED)  
**Testing**: Playwright for UI, test account: pwtester.20250808.001@example.com  
**Linting**: ESLint with @repo/eslint-config + Solid/Turbo plugins  
**Formatting**: Prettier 3.x with lint-staged pre-commit hooks

**Database**: Drizzle SQLite schema with auto-incrementing IDs, text dates, cascade
deletes. Migrations: `pnpm db:gen` → `pnpm db:migrate` in apps/api.

**CORS**: Pre-configured for localhost development (`http://localhost:*`) with credentials.  
**API Proxy**: Web app proxies `/api/*` to API (port 5002) via Vite proxy.

## Development Workflow

### Local Development

**Setup**: `pnpm install` → `pnpm dev` (runs full stack)  
**Focused**: `pnpm dev:web` (port 5000), `pnpm dev:extension`, `turbo dev --filter=api` (port 5002)  
**Database**: `pnpm db:gen` (schema changes) → `pnpm db:migrate` (apply migrations) → `pnpm cf-typegen` (update bindings)

### Quality Gates (Pre-Push)

1. `pnpm lint` MUST pass (max 25 warnings)
2. `pnpm format` MUST be run
3. `pnpm check-types` MUST pass
4. Relevant tests MUST pass (`pnpm -C apps/web test` for UI changes)

### Pull Request Requirements

**MUST include**:

- Clear summary describing what changed and why
- Linked issue reference (Jira/GitHub)
- Screenshots for UI changes
- New environment variables documented (Cloudflare bindings, etc.)
- Commit messages following Conventional Commits
- Green CI status (lint, type checks, tests)

**File Organization Rules**:

- API: `src/routes/{resource}/{action}` → Hono route handlers
- Web: `src/routes/` → SolidStart file-based routing
- Extension: `src/entrypoints/` → WXT entry points, `src/components/` → UI components
- Shared: Package exports in `package.json` exports field

### Build Outputs (Git-Ignored)

- Turbo cache: `.turbo/`
- API: `dist/` (Workers bundle)
- Web: `.vinxi/` + `.output/` (SolidStart)
- Extension: `.wxt/` + `dist/` (WXT builds)

## Governance

### Amendment Process

Constitution changes require:

1. Proposal documenting rationale and impact
2. Validation that all templates (plan, spec, tasks) remain aligned
3. Version bump following semantic versioning rules (see below)
4. Sync Impact Report prepended to constitution as HTML comment
5. Follow-up PR if templates need updates

### Versioning Policy

**MAJOR** (X.0.0): Backward-incompatible principle removals or redefinitions (e.g.,
removing "Test-First" requirement, changing monorepo structure mandate)

**MINOR** (x.Y.0): New principle added or materially expanded guidance (e.g., adding
"Security Standards" principle, expanding "Testing" to require contract tests)

**PATCH** (x.y.Z): Clarifications, wording improvements, typo fixes, non-semantic
refinements (e.g., updating example code, fixing broken links)

### Compliance Review

All PRs MUST verify compliance with NON-NEGOTIABLE principles. Violations of non-negotiable
principles require explicit justification in `plan.md` Complexity Tracking table with:

- What principle is violated
- Why the violation is necessary for current requirements
- What simpler alternative was rejected and why

### Runtime Guidance

Agents and developers MUST consult `.github/copilot-instructions.md` and `AGENTS.md` for
operational guidance (architecture patterns, development workflows, integration points).
Constitution defines WHAT is required; guidance files define HOW to implement.

**Version**: 1.0.0 | **Ratified**: 2025-10-28 | **Last Amended**: 2025-10-28
