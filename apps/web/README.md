# Corvus Web App

Corvus Web is the SolidStart front-end for the Corvus platform. It consumes the API app for authentication and wishlist data and focuses solely on delivering the UI experience.

## Features

- 🔐 **API-backed authentication** – delegates session management to the `api` worker
- 🎯 **Wishlist management UI** – create, edit, and organize wishlist items with rich link support
- 🎨 **Modern design system** – Tailwind CSS with shared UI components from `@repo/ui-components`
- 🧱 **Shared types and utilities** – pulled from the `@repo/common` package to keep the monorepo in sync
- 🧪 **End-to-end testing** – Playwright specs that exercise critical flows

## Tech Stack

- **Framework**: SolidStart on Vinxi
- **Styling**: Tailwind CSS + shared Corvus UI components
- **State & Auth**: SolidJS signals, API-driven session checks
- **Tooling**: TypeScript, ESLint, Prettier, Playwright

## Getting Started

1. **Install dependencies** at the repo root:
   ```bash
   pnpm install
   ```
2. **Run the full stack** (API, web, extension):
   ```bash
   pnpm dev
   ```
3. **Run just the web app** when iterating on UI:
   ```bash
   pnpm --filter web dev
   ```

## Available Scripts (web)

```bash
pnpm --filter web dev        # Start the SolidStart dev server
pnpm --filter web build      # Build for production
pnpm --filter web lint       # ESLint with repo rules
pnpm --filter web check-types# TypeScript project check
pnpm --filter web test       # Playwright headless tests
pnpm --filter web test:ui    # Playwright in UI mode
```

## Project Highlights

- All data access happens through `/api/*` routes that proxy to the API worker—no direct database or Wrangler configuration lives in this app anymore.
- Shared wishlist and auth types come from `@repo/common`, eliminating the old Drizzle schema dependencies.
- Server-side helpers in `src/lib/auth` now focus on cookie forwarding and client session hydration only.

## Directory Overview

```
src/
├── components/          # UI building blocks (dialogs, dashboard, auth forms)
├── lib/
│   ├── auth/            # Auth context, session helpers, crypto utils
│   └── theme/           # Theme context + toggles
└── routes/              # SolidStart file-based routes
```

## Testing

Playwright specs live in `apps/web/tests`. Run them with `pnpm --filter web test` or open the interactive runner using `pnpm --filter web test:ui`.

## Deployment Notes

The API app owns database access, Drizzle ORM migrations, and Wrangler configuration. Deploy the API worker first, then point the web app to the deployed API origin through the `/api` proxy configuration.
