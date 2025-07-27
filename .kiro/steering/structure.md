# Project Structure

## Monorepo Organization

This is a Turborepo monorepo with pnpm workspaces, organized into `apps/` and `packages/` directories.

## Applications (`apps/`)

### `apps/web/`

- **Purpose**: SolidStart web application
- **Port**: 3000 (development)
- **Build Output**: `.vinxi/` and `.output/`
- **Key Files**:
  - `src/app.tsx` - Main application component
  - `src/routes/` - File-based routing
  - `app.config.ts` - SolidStart configuration
  - `tailwind.config.js` - Tailwind CSS configuration

### `apps/extension/`

- **Purpose**: Cross-browser extension built with WXT
- **Build Output**: `.wxt/` and `.output/`
- **Key Files**:
  - `src/entrypoints/` - Extension entry points (content, popup, etc.)
  - `wxt.config.ts` - WXT framework configuration
  - `src/entrypoints/popup/` - Extension popup UI

## Shared Packages (`packages/`)

### `@repo/ui-components`

- **Purpose**: Shared SolidJS component library with Shadcn design system
- **Exports**: Individual components via package.json exports map
- **Key Files**:
  - `src/button.tsx`, `src/card.tsx` - UI components
  - `src/styles.css` - Base styles and Tailwind imports
  - `src/utils.ts` - Utility functions (cn helper)

### `@repo/common`

- **Purpose**: Shared utilities and types across applications
- **Key Files**:
  - `src/types.ts` - Common TypeScript types
  - `src/utils.ts` - Shared utility functions

### `@repo/eslint-config`

- **Purpose**: Shared ESLint configurations
- **Key Files**:
  - `base.js` - Base ESLint config with SolidJS, TypeScript, and Turbo rules

### `@repo/typescript-config`

- **Purpose**: Shared TypeScript configurations
- **Key Files**:
  - `base.json` - Base TypeScript configuration
  - `solid-library.json` - SolidJS library-specific config

## Configuration Files

### Root Level

- `turbo.json` - Turborepo task configuration and caching
- `pnpm-workspace.yaml` - pnpm workspace definition
- `package.json` - Root package with shared scripts and dev dependencies
- `eslint.config.js` - Root ESLint configuration
- `commitlint.config.js` - Conventional commit configuration

### Git Hooks

- `.husky/` - Git hooks for pre-commit linting and commit message validation
- `lint-staged` configuration in root package.json

## Build Outputs (Ignored)

- `.turbo/` - Turborepo cache
- `node_modules/` - Dependencies
- `.wxt/` - WXT build artifacts
- `.vinxi/` - Vinxi build artifacts
- `.output/` - Production build outputs
- `dist/` - Distribution files

## Naming Conventions

- Packages use `@repo/` namespace
- Apps use simple names (`web`, `extension`)
- All packages are private (not published to npm)
- TypeScript files use `.ts`/`.tsx` extensions
- Component files use PascalCase (`Button.tsx`)
- Utility files use camelCase (`utils.ts`)
