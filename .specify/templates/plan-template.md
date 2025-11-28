# Implementation Plan: [FEATURE]

**Branch**: `[###-feature-name]` | **Date**: [DATE] | **Spec**: [link]
**Input**: Feature specification from `/specs/[###-feature-name]/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

[Extract from feature spec: primary requirement + technical approach from research]

## Technical Context

**Language/Version**: TypeScript 5.8.x (strict mode)
**Primary Dependencies**: SolidJS 1.8.x, SolidStart 1.0.x, Hono 4.x, Drizzle ORM 0.36.x
**Storage**: Cloudflare D1 (SQLite) with Drizzle migrations
**Testing**: Playwright (E2E for web), Vitest (unit/integration for API)
**Target Platform**: Cloudflare Workers (API), Cloudflare Pages (web), Browser extension (Chrome/Firefox)
**Project Type**: Monorepo (Turborepo) - multi-app with shared packages
**Performance Goals**: [Feature-specific, e.g., <200ms API response, 60fps UI, or N/A]
**Constraints**: [Feature-specific, e.g., offline-capable, <100KB bundle size, or N/A]
**Scale/Scope**: [Feature-specific, e.g., 1000 concurrent users, 10K wishlists, or NEEDS CLARIFICATION]

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

### I. Monorepo Organization ✅/❌

- [ ] New code placed in correct directory (`apps/` or `packages/`)
- [ ] Shared code extracted to `@repo/common` or `@repo/ui-components`
- [ ] Dependencies use workspace protocol (`workspace:*`)
- [ ] Turbo orchestration configured for new tasks

### II. Type Safety & Quality Gates ✅/❌

- [ ] TypeScript strict mode enabled
- [ ] ESLint configuration applied (zero errors, ≤25 warnings)
- [ ] No `any` types (or justified in code comments)
- [ ] Type checking passes (`pnpm check-types`)

### III. Component Reusability ✅/❌

- [ ] UI components in `@repo/ui-components` for cross-app reuse
- [ ] class-variance-authority used for variants
- [ ] Tailwind CSS for styling (no inline/CSS-in-JS)
- [ ] Application-specific components in respective app directories

### IV. API-First Architecture ✅/❌

- [ ] Business logic in API backend (`apps/api`)
- [ ] Drizzle ORM for database operations
- [ ] API endpoints versioned and documented
- [ ] Database migrations defined (`pnpm db:gen`)
- [ ] GraphQL schema synced with resolvers (if applicable)

### V. Testing Discipline ✅/❌

- [ ] Critical user journeys have Playwright tests (web app)
- [ ] API has Vitest unit/integration tests
- [ ] Contract tests for API endpoints
- [ ] Tests for happy path + primary error scenarios

**Violations Requiring Justification**: [List any ❌ items and why they're necessary]

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (Corvus Monorepo)

<!--
  ACTION REQUIRED: Specify which apps/packages are affected by this feature.
  Delete sections that don't apply. Add file paths for new/modified files.
-->

```text
# Web Application (if feature touches web UI)
apps/web/
├── src/
│   ├── components/           # App-specific components
│   ├── routes/               # SolidStart file-based routes
│   ├── lib/                  # Web app utilities
│   └── [feature files]
└── tests/
    └── e2e/                  # Playwright tests

# API Backend (if feature touches backend logic)
apps/api/
├── src/
│   ├── db/                   # Drizzle schema & migrations
│   ├── routes/               # Hono API routes
│   ├── graphql/              # GraphQL schema & resolvers
│   └── [feature files]
└── tests/
    ├── contract/             # API contract tests
    ├── integration/          # Integration tests
    └── unit/                 # Unit tests

# Browser Extension (if feature touches extension)
apps/extension/
├── entrypoints/              # Extension entry points (popup, background, etc.)
│   └── [feature files]
└── components/               # Extension-specific components

# Shared UI Components (if creating reusable components)
packages/ui-components/
└── src/
    └── [new component files]

# Shared Utilities (if creating shared logic)
packages/common/
└── src/
    └── [new utility files]
```

**Affected Apps**: [List which apps are impacted: web, api, extension]
**New Shared Packages**: [List any new `@repo/*` packages or N/A]
**Database Changes**: [Yes/No - if yes, migration files required]

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation                  | Why Needed         | Simpler Alternative Rejected Because |
| -------------------------- | ------------------ | ------------------------------------ |
| [e.g., 4th project]        | [current need]     | [why 3 projects insufficient]        |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient]  |
