# GraphQL Migration Plan

## Overview

Document the path for migrating `apps/api` from the current Hono REST service (`apps/api/src/index.tsx`) to a single GraphQL endpoint that serves both the web UI and browser extension. The plan keeps Cloudflare Workers + D1 + Drizzle as the execution environment and reuses existing domain services in `apps/api/src/lib/`.

## Current REST Baseline

- **Routing**: Hono app mounted under `/api/auth` and `/api/wishlist`, see `apps/api/src/index.tsx`.
- **Auth domain**: `AuthService` handles registration, login, sessions, and default category seeding (`apps/api/src/lib/auth/service.ts`).
- **Wishlist domain**: `WishlistService` provides CRUD + aggregation for categories, items, and links (`apps/api/src/lib/wishlist/service.ts`).
- **Database schema**: Drizzle definitions for `users`, `sessions`, `wishlist_categories`, `wishlist_items`, `wishlist_item_links` (`apps/api/src/lib/db/schema.ts`).

## Target GraphQL Architecture

- **Schema**: Single endpoint (`/graphql`) exposing `Query` types for session/user information and wishlist data, plus `Mutation` types for auth and CRUD operations. `WishlistPayload` mirrors the REST aggregation payload today.
- **Context & auth**: Request context extracts session cookies, validates via `AuthService.validateSession()`, and injects `{ db, user }` into resolvers.
- **Resolvers**: Thin adapters that call existing services (`AuthService`, `WishlistService`); field resolvers lazy-load linked data such as `WishlistItem.links`.
- **Runtime**: Use GraphQL Yoga with `@graphql-tools/schema` to serve the schema inside the existing Hono worker, keeping current CORS behavior. GraphQL Yoga provides excellent Cloudflare Workers support and built-in GraphiQL playground.
- **Schema management**: Store SDL in `apps/api/src/graphql/schema.graphql` and generate TypeScript types with GraphQL Code Generator.
- **Client data fetching**: Standardize on TanStack Query hooks for GraphQL queries and mutations across the web app and extension.

## Task Checklist

- [x] **Phase 1 – Foundation**
  - [x] Add GraphQL Yoga and @graphql-tools/schema dependencies and bootstrap the GraphQL handler within the existing Hono app.
  - [x] Create schema SDL definitions plus codegen pipeline.
  - [x] Build context factory that attaches `DB`, session user, and request metadata.
- [ ] **Phase 2 – Resolver Implementation**
  - [ ] Implement `Query` resolvers for `me`, `wishlist`, `categories`, `item` using `AuthService` and `WishlistService`.
  - [ ] Implement `Mutation` resolvers covering auth, category, item, and link operations.
  - [ ] Normalize error handling (auth failures, validation issues) into GraphQL-friendly responses.
- [ ] **Phase 3 – Client Integration**
  - [ ] Update `apps/web` data layer to use TanStack Query for GraphQL operations (define queries/mutations).
  - [ ] Update `apps/extension` to adopt TanStack Query for GraphQL interactions.
  - [ ] Ensure session cookies flow with GraphQL requests in both clients.
- [ ] **Phase 4 – Coexistence & Rollout**
  - [ ] Expose GraphQL under `/graphql` while keeping REST routes for compatibility.
  - [ ] Add environment flag or config toggle letting clients choose REST vs GraphQL.
  - [ ] Document API usage and share migration guides with frontend teams.
- [ ] **Phase 5 – Tooling & Ops**
  - [ ] Extend Vitest and Playwright suites with GraphQL-focused tests.
  - [ ] Update Turbo tasks, Wrangler config, and CI scripts for schema/codegen steps.
  - [ ] Monitor and log GraphQL traffic for parity checks during rollout.
- [ ] **Phase 6 – Decommission REST**
  - [ ] Remove unused REST routes once clients fully migrate.
  - [ ] Clean up redundant DTOs/utilities and simplify `apps/api/src/index.tsx`.
  - [ ] Archive REST-specific documentation.

## Migration Notes

- Run REST and GraphQL in parallel until both clients ship GraphQL consumption.
- Preserve existing cookie-based session model; avoid introducing new auth mechanisms during initial migration.
- Align pagination/filter defaults in GraphQL schema with `WishlistService.getUserWishlistData()` to maintain UI behavior.
