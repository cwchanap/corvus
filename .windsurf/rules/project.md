---
trigger: always_on
---

## Repository Overview

This is a Turborepo monorepo built with SolidJS that includes a browser extension and web application for wishlist management. The project uses pnpm as the package manager and Turbo for build orchestration.

## Key Applications

- **`apps/web`**: SolidStart web application with authentication system and Cloudflare D1 database integration
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

# Run all apps in development mode
pnpm dev

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
# Web app development (runs on port 3000)
turbo dev --filter=web

# Extension development
turbo dev --filter=extension

# Build specific app
turbo build --filter=web
turbo build --filter=extension
```

### Web App Database Commands

```bash
# Set up local database
cd apps/web && npm run setup-db

# Apply schema to local D1 database
cd apps/web && npm run db:local

# Apply schema to remote D1 database
cd apps/web && npm run db:remote
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

## Architecture Notes

### Web Application

- Built with SolidStart and Vinxi
- Uses Cloudflare D1 database with Drizzle ORM
- Authentication system with session management
- Drizzle ORM integration for D1
- Falls back to mock database for local development when D1 is unavailable

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

- Web app: `.vinxi/` and `.output/` directories
- Extension: `.wxt/` and `dist/` directories
- Turbo cache: `.turbo/` directory

# IMPORTANT!!

Use Playwright MCP to interact with browser for testing. DON't USE windsurf built browser! Also don't run `npm run dev` to start the server as it may already started, check if it is running first: http://localhost:5000/

## E2E Test Account (Local/Dev Only)

Email: pwtester.20250808.001@example.com
Password: Password123!
