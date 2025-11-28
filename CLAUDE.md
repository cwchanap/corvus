# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is a Turborepo monorepo built with SolidJS for wishlist management, featuring a web application, API backend, and browser extension. The project uses pnpm as the package manager and Turbo for build orchestration.

## Key Applications

- **`apps/web`**: SolidStart web application (port 5000) with authentication system and API proxy
- **`apps/api`**: Hono-based Cloudflare Workers API (port 8787) with Drizzle ORM for D1 database operations
- **`apps/extension`**: WXT-based browser extension for adding items to wishlists

## Shared Packages

- **`@repo/ui-components`**: SolidJS component library with Tailwind CSS and class-variance-authority
- **`@repo/common`**: Shared utilities and TypeScript types
- **`@repo/eslint-config`**: ESLint configurations for SolidJS
- **`@repo/typescript-config`**: TypeScript configurations

## Development Commands

### Root Level Commands

```bash
# Install dependencies
pnpm install

# Run API + web + extension in development mode
pnpm dev

# Run only web app development (with database setup)
pnpm dev:web

# Run web app with Cloudflare backend
pnpm dev:web:cf

# Run web app with split frontend/backend
pnpm dev:web:split

# Run extension development
pnpm dev:extension

# Build all apps and packages
pnpm build

# Lint all packages
pnpm lint

# Fix linting issues
pnpm lint:fix

# Type checking across all packages
pnpm check-types

# Format code with Prettier
pnpm format
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
cd apps/api && pnpm db:gen

# Apply migrations to local D1 database
cd apps/api && pnpm db:migrate

# Generate Cloudflare types
cd apps/api && pnpm cf-typegen

# Deploy API to Cloudflare Workers
cd apps/api && pnpm deploy
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
# Run Playwright tests for web app
cd apps/web && pnpm test

# Run Playwright tests with UI
cd apps/web && pnpm test:ui
```

## Architecture Notes

### API Backend

- Built with Hono framework for Cloudflare Workers
- Uses Drizzle ORM with Cloudflare D1 database
- Runs on port 8787 in development
- Database migrations managed through Drizzle Kit

### Web Application

- Built with SolidStart and Vinxi
- Runs on port 5000 in development
- Proxies `/api` requests to the API backend (port 8787)
- Authentication system with Better Auth
- Cloudflare Pages deployment target

### Browser Extension

- Built with WXT framework and SolidJS
- Supports both Chrome and Firefox
- Uses browser storage API for wishlist persistence
- Popup interface for adding and managing wishlist items

### Shared Components

- UI components use class-variance-authority for variants
- Tailwind CSS for styling
- TypeScript throughout with strict type checking

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
