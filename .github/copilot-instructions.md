# Copilot Instructions for Corvus

## Architecture Overview

**Corvus** is a Turborepo monorepo for wishlist management with three main applications:

- **`apps/api`**: Hono + Cloudflare Workers API (port 5002) with Drizzle ORM + D1 database
- **`apps/web`**: SolidStart web app (port 5000) with Better Auth, proxies `/api` to backend
- **`apps/extension`**: WXT-based browser extension with SolidJS popup interface

## Key Patterns

### SolidJS Component Architecture

- Use `splitProps()` to separate component props: `const [local, others] = splitProps(props, ['variant', 'class'])`
- UI components follow class-variance-authority pattern: `cva()` with variants and `cn()` utility
- Export interfaces alongside components: `export interface ButtonProps extends ComponentProps<'button'>`

### Database & API Layer

- **Schema**: Drizzle SQLite with auto-incrementing IDs, text dates, and cascade deletes
- **API Routes**: Hono with grouped routes: `app.route("/api/auth", authRoutes)`
- **CORS**: Pre-configured for localhost development with credentials support
- **Migrations**: Use `pnpm db:gen` → `pnpm db:migrate` workflow in `apps/api`

### Authentication Flow

- Better Auth integration with session-based auth
- `AuthProvider` context wraps app, handles SSR skip: `if (isServer) return null`
- API proxy at `/api` routes requests from web app (port 5000) to API (port 5002)
- Use `credentials: "include"` for all authenticated requests

### Extension Development

- **WXT Framework**: Entrypoints in `src/entrypoints/` (popup, content scripts)
- **Manifest v3**: Permissions in `wxt.config.ts`, not manifest.json
- **Storage**: Browser storage API for offline wishlist persistence
- **Build targets**: Chrome (`pnpm dev`) and Firefox (`pnpm dev:firefox`)

## Development Workflows

### Initial Setup

```bash
pnpm install                    # Install all dependencies
pnpm dev                        # Run API + web + extension
```

### Focused Development

```bash
pnpm dev:web                    # Web app only (with DB setup)
pnpm dev:extension              # Extension only
turbo dev --filter=api          # API only
```

### Database Operations (apps/api)

```bash
pnpm db:gen                     # Generate migrations from schema changes
pnpm db:migrate                 # Apply to local D1 database
pnpm cf-typegen                 # Generate Cloudflare bindings
```

### Testing

```bash
cd apps/web && pnpm test        # Playwright tests
# Test account: pwtester.20250808.001@example.com / Password123!
```

## Project Structure Conventions

### Workspace Dependencies

- `@repo/ui-components`: Shared SolidJS components with Tailwind + CVA
- `@repo/common`: Types and utilities, exported from `src/types.ts`
- `@repo/eslint-config`: SolidJS-specific ESLint rules (25 warning limit)
- `@repo/typescript-config`: Shared tsconfig.json bases

### File Organization

- **API**: `src/routes/{resource}/{action}` → Hono route handlers
- **Web**: `src/routes/` → SolidStart file-based routing
- **Extension**: `src/entrypoints/` → WXT entry points, `src/components/` → UI components
- **Shared**: Package exports defined in `package.json` exports field

### Build Outputs

- Turbo cache: `.turbo/`
- API: `dist/` (Workers bundle)
- Web: `.vinxi/` + `.output/` (SolidStart)
- Extension: `.wxt/` + `dist/` (WXT builds)

## Integration Points

### API ↔ Web Communication

- Web app proxies `/api/*` requests to `localhost:5002` via Vite proxy
- CORS configured for `http://localhost:*` origins with credentials
- Database sessions managed via cookies with cascade deletion

### Extension ↔ Web Integration

- Shared components via `@repo/ui-components` package
- Common types via `@repo/common/src/types.ts`
- Extension uses browser storage API independently from web app database

### Cloudflare Deployment

- **API**: Workers with D1 database binding in `wrangler.jsonc`
- **Web**: Pages with `cloudflare-pages` preset in `app.config.ts`
- Environment variables managed through Cloudflare dashboard

## Code Quality Standards

- TypeScript strict mode across all packages
- ESLint max 25 warnings (enforced in CI)
- Prettier formatting with lint-staged pre-commit hooks
- Conventional commits with commitlint validation
