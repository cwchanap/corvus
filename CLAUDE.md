# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is a Turborepo monorepo built with SolidJS for wishlist management, featuring a web application, API backend, and browser extension. The project uses Bun as the package manager and Turbo for build orchestration.

## Key Applications

- **`apps/web`**: SolidStart web application (port 5000) with custom session-based auth and GraphQL client
- **`apps/api`**: Hono-based Cloudflare Workers API (port 8787) exposing a single `/graphql` endpoint via GraphQL Yoga; also serves web app static assets in production
- **`apps/extension`**: WXT-based browser extension that communicates with the API via GraphQL (not browser storage)

## Shared Packages

- **`@repo/ui-components`**: SolidJS component library with Tailwind CSS and class-variance-authority
- **`@repo/common`**: Shared utilities and TypeScript types
- **`@repo/eslint-config`**: ESLint configurations for SolidJS
- **`@repo/typescript-config`**: TypeScript configurations

## Development Commands

### Root Level Commands

```bash
# Install dependencies
bun install

# Run API + web + extension in development mode
bun dev

# Run only web app development (with database setup)
bun dev:web

# Run web app with Cloudflare backend
bun dev:web:cf

# Run web app with split frontend/backend
bun dev:web:split

# Run extension development
bun dev:extension

# Build all apps and packages
bun build

# Lint all packages
bun lint

# Fix linting issues
bun lint:fix

# Type checking across all packages
bun check-types

# Format code with Prettier
bun format
```

### App-Specific Development

```bash
# Web app development (runs on port 5000)
turbo dev --filter=web

# API development (runs on port 8787)
turbo dev --filter=api

# Extension development
turbo dev --filter=extension

# Build specific app
turbo build --filter=web
turbo build --filter=api
turbo build --filter=extension
```

### API Database Commands

```bash
# Generate migration files
cd apps/api && bun db:gen

# Apply migrations to local D1 database
cd apps/api && bun db:migrate

# Generate Cloudflare types
cd apps/api && bun cf-typegen

# Deploy API to Cloudflare Workers
cd apps/api && bun deploy
```

### Extension Commands

```bash
# Development for Chrome
cd apps/extension && npm run dev

# Development for Firefox
cd apps/extension && npm run dev:firefox

# Build extension
cd apps/extension && npm run build

# Create extension zip file
cd apps/extension && npm run zip
```

### Testing Commands

```bash
# Run API unit tests (Vitest)
cd apps/api && bun run test

# Run a single API test file
cd apps/api && bun run test tests/auth/service.test.ts

# Run API tests with coverage
cd apps/api && bun run test:coverage

# Run Playwright E2E tests
bun --cwd packages/e2e test

# Run a specific E2E test file
bun --cwd packages/e2e test tests/auth.e2e.spec.ts

# Run Playwright tests with UI
bun --cwd packages/e2e test:ui
```

## Architecture Notes

### API Backend

- Built with Hono framework for Cloudflare Workers
- Single GraphQL endpoint at `/graphql` using GraphQL Yoga + `@graphql-tools/schema`
- Schema defined in `apps/api/src/graphql/schema.graphql`; resolvers in `resolvers.ts`
- Custom session-based authentication (no third-party auth library) in `src/lib/auth/`
- Uses Drizzle ORM with Cloudflare D1 (SQLite); schema in `src/lib/db/schema.ts`
- In production, also serves web app static assets via a catch-all route (single Cloudflare Worker deployment)
- Unit tests live in `apps/api/tests/` (not alongside source)

### Web Application

- Built with SolidStart and Vinxi
- Runs on port 5000 in development
- In dev, proxies `/graphql` requests to the API backend (port 8787)
- GraphQL client in `src/lib/graphql/`; auth via GraphQL mutations (register/login/logout)
- Deployment: static assets served by the same Cloudflare Worker as the API

### Browser Extension

- Built with WXT framework and SolidJS; uses `npm` (not `bun`) as its package manager
- Supports both Chrome and Firefox
- Communicates with the API via GraphQL (shares `@repo/common/graphql/client`)
- State managed via SolidJS context (`src/lib/wishlist/context.tsx`)

### Shared Packages

- `@repo/ui-components`: SolidJS components using class-variance-authority for variants, Tailwind CSS
- `@repo/common`: Shared GraphQL client utility (`graphql/client.ts`) used by both web and extension; also shared TypeScript types

## Code Quality

- ESLint with max 25 warnings allowed during linting
- Prettier for code formatting
- Husky and lint-staged for pre-commit hooks
- Commitlint with conventional commit format
- TypeScript strict mode enabled across all packages

## Build Outputs

- API: `dist/` directory (Cloudflare Workers bundle)
- Web app: `.vinxi/` and `.output/` directories (SolidStart build)
- Extension: `.wxt/` and `dist/` directories (WXT build)
- Turbo cache: `.turbo/` directory

## Project Constitution

For project-wide governance, architectural principles, and non-negotiable rules, refer to `.specify/memory/constitution.md`. The constitution defines:

- **Core Principles**: Monorepo organization, type safety, component reusability, API-first architecture, testing discipline
- **Technology Stack**: Mandatory technology choices and deviation policies
- **Development Workflow**: Local development, pre-commit requirements, build & deployment, testing gates
- **Governance**: Amendment process, compliance review, versioning policy

When conflicts arise between development practices, the constitution supersedes all other guidance.
