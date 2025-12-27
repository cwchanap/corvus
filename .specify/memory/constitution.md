<!--
Sync Impact Report:
Version Change: Template → 1.0.0 (Initial ratification)
Modified Principles: N/A (first version)
Added Sections:
  - I. Monorepo Organization
  - II. Type Safety & Quality Gates
  - III. Component Reusability
  - IV. API-First Architecture
  - V. Testing Discipline
  - Technology Stack
  - Development Workflow
  - Governance
Removed Sections: N/A
Templates Requiring Updates:
  ✅ plan-template.md - Constitution Check section updated with Corvus-specific gates, Technical Context section pre-filled with Corvus stack, Project Structure section updated for monorepo
  ✅ spec-template.md - No changes required (already aligned with API-first and component reusability)
  ✅ tasks-template.md - No changes required (already reflects monorepo structure and testing discipline)
  ✅ CLAUDE.md - Added Project Constitution section with reference to this file
Follow-up TODOs: None
-->

# Corvus Constitution

## Core Principles

### I. Monorepo Organization

**Rule**: All applications (`web`, `api`, `extension`) and shared packages (`@repo/ui-components`, `@repo/common`, `@repo/eslint-config`, `@repo/typescript-config`) MUST reside in a single Turborepo monorepo.

**Requirements**:

- New applications MUST be placed in `apps/` directory
- New shared packages MUST be placed in `packages/` directory with `@repo/` namespace
- Shared code MUST be extracted to `@repo/common` or `@repo/ui-components` packages
- Each package MUST have explicit dependencies in `package.json` using workspace protocol (`workspace:*`)
- Build orchestration MUST use Turbo for caching and parallel execution

**Rationale**: Monorepo structure enables code sharing, consistent tooling, and atomic cross-package changes while maintaining clear boundaries between applications.

### II. Type Safety & Quality Gates

**Rule**: 100% TypeScript coverage is MANDATORY. All code MUST pass strict type checking and quality gates before merging.

**Requirements**:

- TypeScript strict mode MUST be enabled across all packages
- ESLint MUST enforce zero errors; maximum 25 warnings allowed during linting (`lint` script)
- Prettier MUST format all code; pre-commit hooks enforce formatting
- Type checking MUST pass (`pnpm check-types`) before commits
- Conventional commit format MUST be enforced via commitlint
- No `any` types except when interfacing with untyped third-party libraries (requires justification in code comments)

**Rationale**: Type safety prevents runtime errors and serves as living documentation. Quality gates prevent technical debt accumulation.

### III. Component Reusability

**Rule**: UI components MUST be built as reusable, framework-agnostic abstractions in `@repo/ui-components`.

**Requirements**:

- All shared UI components MUST live in `@repo/ui-components` package
- Components MUST use class-variance-authority for variant management
- Tailwind CSS MUST be used for styling (no inline styles or CSS-in-JS)
- Components MUST be independently testable and documented
- Application-specific components stay in respective app directories (`apps/web/src/components/`, etc.)
- Before creating a new component, check if it exists or can be generalized in `@repo/ui-components`

**Rationale**: Centralizing reusable components ensures consistency across web app and extension, reduces duplication, and accelerates feature development.

### IV. API-First Architecture

**Rule**: The backend API (`apps/api`) MUST be the single source of truth for business logic and data operations.

**Requirements**:

- All business logic MUST reside in the API backend (Hono + Cloudflare Workers)
- Database operations MUST use Drizzle ORM with type-safe queries
- API endpoints MUST be versioned and documented
- Frontend applications (web, extension) MUST consume API via well-defined contracts
- Database schema changes MUST use Drizzle Kit migrations (`pnpm db:gen`, `pnpm db:migrate`)
- GraphQL schema MUST be kept in sync with resolvers via codegen

**Rationale**: API-first design enables multiple clients (web, extension, future mobile apps) to share business logic and ensures data consistency.

### V. Testing Discipline

**Rule**: Critical user journeys MUST have automated tests. Integration tests are REQUIRED for API contracts and cross-application flows.

**Requirements**:

- Web app MUST use Playwright for end-to-end testing of critical user flows
- API MUST use Vitest for unit and integration tests
- Contract tests MUST verify API endpoint responses match expected schemas
- Breaking changes to API contracts MUST be caught by tests before deployment
- Tests MUST run in CI/CD pipeline before merging
- New features MUST include tests for happy path and primary error scenarios (edge cases optional unless critical)

**Rationale**: Automated tests prevent regressions in multi-application monorepo where changes in one package can break others.

## Technology Stack

**Enforcement**: All technology choices below are MANDATORY for consistency and maintainability.

| Layer                  | Technology                | Justification                                        |
| ---------------------- | ------------------------- | ---------------------------------------------------- |
| **Package Manager**    | pnpm 9.x                  | Workspace support, fast, disk-efficient              |
| **Monorepo**           | Turborepo                 | Build caching, task orchestration                    |
| **Frontend Framework** | SolidJS                   | Reactive, performant, TypeScript-first               |
| **Web App**            | SolidStart + Vinxi        | File-based routing, SSR, Cloudflare Pages deployment |
| **API Backend**        | Hono + Cloudflare Workers | Edge computing, low latency, serverless              |
| **Database**           | Cloudflare D1 (SQLite)    | Serverless, integrated with Workers                  |
| **ORM**                | Drizzle ORM               | Type-safe, migration support, D1 compatible          |
| **Browser Extension**  | WXT + SolidJS             | Modern extension framework, multi-browser support    |
| **Styling**            | Tailwind CSS              | Utility-first, consistent design system              |
| **Linting**            | ESLint 9.x                | SolidJS-specific rules via `@repo/eslint-config`     |
| **Formatting**         | Prettier                  | Consistent code style                                |
| **Testing (E2E)**      | Playwright                | Web app user journey testing                         |
| **Testing (Unit)**     | Vitest                    | Fast, TypeScript-native, ESM support                 |
| **Commits**            | Commitlint                | Conventional commit format enforcement               |

**Deviation Policy**: Changes to core technologies (framework, database, build tools) require architectural review and migration plan.

## Development Workflow

### Local Development

- MUST run `pnpm install` after pulling changes that modify dependencies
- MUST use `pnpm dev` to run all apps concurrently OR app-specific commands (`pnpm dev:web`, `pnpm dev:extension`)
- MUST use `pnpm lint:fix` to auto-fix linting issues before committing
- MUST run `pnpm check-types` to verify TypeScript compilation

### Pre-Commit Requirements

- Husky + lint-staged MUST run on staged files:
  - Auto-fix ESLint issues (max 25 warnings enforced)
  - Auto-format with Prettier
  - Enforce conventional commit messages via commitlint

### Build & Deployment

- Production builds MUST use `pnpm build` (runs Turbo orchestration)
- API deployment MUST use `pnpm deploy` (Cloudflare Workers)
- Database migrations MUST be applied before deploying API changes that depend on schema updates
- Turbo cache MUST be used in CI/CD for faster builds

### Testing Gates

- E2E tests MUST pass before deploying web app (`pnpm -C apps/web test`)
- Unit tests MUST pass for API before deployment (`pnpm -C apps/api test`)
- Integration tests MUST validate API contracts before releasing breaking changes

## Governance

### Amendment Process

1. Proposed changes MUST be documented in a PR with rationale
2. Constitution amendments MUST increment version using semantic versioning:
   - **MAJOR**: Backward-incompatible governance changes (e.g., removing principles, technology stack changes)
   - **MINOR**: New principles or materially expanded guidance
   - **PATCH**: Clarifications, wording fixes, non-semantic refinements
3. All affected templates (`.specify/templates/*.md`) MUST be updated to reflect changes
4. Sync Impact Report MUST be generated and prepended to constitution file

### Compliance Review

- All PRs MUST verify compliance with constitution principles during code review
- Deviations from principles MUST be explicitly justified in PR description
- Template updates (spec, plan, tasks) MUST reference constitution sections when applicable

### Versioning Policy

- Constitution MUST maintain version number in footer
- Ratification date reflects original adoption
- Last amended date reflects most recent change
- Version history MUST be tracked via Sync Impact Reports in constitution file

### Runtime Guidance

- Use `CLAUDE.md` for AI assistant development guidance (agent-specific instructions)
- Use `.specify/memory/constitution.md` (this file) for project-wide governance and principles
- When conflict arises, constitution supersedes all other practices

**Version**: 1.0.0 | **Ratified**: 2025-11-27 | **Last Amended**: 2025-11-27
