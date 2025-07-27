# Technology Stack

## Core Technologies

- **SolidJS**: Primary frontend framework for reactive UI components
- **TypeScript**: Static type checking across all packages (v5.8.3)
- **Turborepo**: Monorepo build system with caching and task orchestration
- **pnpm**: Package manager (v9.0.0) with workspace support

## Application Frameworks

- **SolidStart**: Full-stack framework for the web application with Vinxi
- **WXT**: Browser extension framework with cross-browser support

## Styling & UI

- **Tailwind CSS**: Utility-first CSS framework
- **Shadcn**: Design system components
- **Class Variance Authority (CVA)**: Component variant management
- **PostCSS**: CSS processing with Autoprefixer

## Development Tools

- **ESLint**: Code linting with SolidJS-specific rules
- **Prettier**: Code formatting
- **Husky**: Git hooks for pre-commit checks
- **Commitlint**: Conventional commit message enforcement
- **lint-staged**: Run linters on staged files

## Common Commands

### Development

```bash
# Start all apps in development mode
pnpm dev

# Start specific app
turbo dev --filter=web        # Web app (port 3000)
turbo dev --filter=extension  # Browser extension

# Start extension for Firefox
pnpm --filter=extension dev:firefox
```

### Building

```bash
# Build all packages and apps
pnpm build

# Build specific package
turbo build --filter=web
turbo build --filter=extension
```

### Code Quality

```bash
# Lint all packages
pnpm lint

# Fix linting issues
pnpm lint:fix

# Format code
pnpm format

# Type checking
pnpm check-types
```

### Extension Specific

```bash
# Build extension for production
pnpm --filter=extension build

# Build for Firefox
pnpm --filter=extension build:firefox

# Create distribution zip
pnpm --filter=extension zip
```

## Node.js Requirements

- Node.js >= 18
- pnpm as the package manager
