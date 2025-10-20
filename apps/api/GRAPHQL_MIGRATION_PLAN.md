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
- [x] **Phase 2 – Resolver Implementation**
  - [x] Implement `Query` resolvers for `me`, `wishlist`, `categories`, `item` using `AuthService` and `WishlistService`.
  - [x] Implement `Mutation` resolvers covering auth, category, item, and link operations.
  - [x] Normalize error handling (auth failures, validation issues) into GraphQL-friendly responses.
  - [x] Create type mappers to convert between DB snake_case and GraphQL camelCase types.
  - [x] Fix session cookie persistence in GraphQL auth mutations.
  - [x] Merge Hono headers into Yoga response to propagate Set-Cookie headers.
- [x] **Phase 3 – Client Integration (Web App)**
  - [x] Install TanStack Query (`@tanstack/solid-query`) for web app.
  - [x] Create GraphQL client utilities with `graphqlRequest` function.
  - [x] Define GraphQL queries and mutations for auth operations.
  - [x] Define GraphQL queries and mutations for wishlist CRUD operations.
  - [x] Create TanStack Query hooks for all GraphQL operations.
  - [x] Set up `GraphQLProvider` and wrap app root.
  - [x] Ensure session cookies flow automatically with `credentials: "include"`.
- [x] **Phase 3 – Client Integration (Extension)**
  - [x] Extract shared GraphQL utilities to `@repo/common` package.
  - [x] Create GraphQL client wrapper for extension.
  - [x] Create auth operation wrappers using shared queries.
  - [x] Create wishlist operation wrappers using shared queries.
  - [x] Ensure session cookies flow with `credentials: "include"`.
- [x] **Phase 4 – Decommission REST (Skipped Coexistence)**
  - [x] Remove all REST routes from API (`apps/api/src/routes/`).
  - [x] Update extension to use GraphQL instead of REST API.
  - [x] API is now GraphQL-only at `/graphql` endpoint.
- [x] **Phase 5 – Cleanup & Production Readiness**
  - [x] Fixed P0 production bug: Extension uses VITE_API_BASE instead of VITE_API_URL.
  - [x] Removed obsolete REST client code from `@repo/common`.
  - [x] Removed obsolete REST types (auth.ts, wishlist.ts).
  - [x] Removed unused storage abstraction layer.
  - [x] Updated extension components to remove WishlistApiError dependencies.
  - [x] Updated web app to use GraphQL types (GraphQLUser instead of PublicUser).
  - [x] Fixed Set-Cookie header handling in GraphQL handler (append vs overwrite).
  - [x] Cleaned ~1,500 lines of obsolete code.
- [ ] **Phase 6 – Testing & Monitoring (Optional)**
  - [ ] Add GraphQL-specific E2E tests with Playwright.
  - [ ] Add monitoring/logging for GraphQL operations.
  - [ ] Performance testing for GraphQL vs previous REST.

## Migration Notes

- Run REST and GraphQL in parallel until both clients ship GraphQL consumption.
- Preserve existing cookie-based session model; avoid introducing new auth mechanisms during initial migration.
- Align pagination/filter defaults in GraphQL schema with `WishlistService.getUserWishlistData()` to maintain UI behavior.
