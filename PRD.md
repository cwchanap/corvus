# Product Requirements Document: Corvus Wishlist — Feature Expansion

**Version:** 1.0
**Date:** 2026-03-24
**Status:** Draft
**Audience:** Engineering, Design, Product

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Current State and Problem Statement](#2-current-state-and-problem-statement)
3. [Goals and Success Metrics](#3-goals-and-success-metrics)
4. [User Personas](#4-user-personas)
5. [Feature Specifications](#5-feature-specifications)
   - [F-01: Duplicate URL Detection](#f-01-duplicate-url-detection)
   - [F-02: Item Status and Priority Tracking](#f-02-item-status-and-priority-tracking)
   - [F-03: Recently Added Widget](#f-03-recently-added-widget)
   - [F-04: Per-Item Markdown Notes](#f-04-per-item-markdown-notes)
   - [F-05: URL Metadata Auto-Fetch](#f-05-url-metadata-auto-fetch)
   - [F-06: Keyboard Shortcut System and Command Palette](#f-06-keyboard-shortcut-system-and-command-palette)
   - [F-07: Export and Import (JSON and CSV)](#f-07-export-and-import-json-and-csv)
   - [F-08: Shareable Public Wishlists](#f-08-shareable-public-wishlists)
6. [Implementation Roadmap](#6-implementation-roadmap)
7. [Non-Functional Requirements](#7-non-functional-requirements)
8. [Out of Scope](#8-out-of-scope)

---

## 1. Executive Summary

### Product Vision

Corvus is a personal wishlist management application built on a SolidStart frontend and a Cloudflare Workers API backend, backed by a D1 SQLite database accessed through Drizzle ORM and a GraphQL layer powered by GraphQL Yoga. Users organise saved items into colour-coded categories, associate multiple links with each item, and perform bulk operations. The application is also accessible via a WXT-based browser extension that shares the same GraphQL client.

The eight features described in this document represent the next maturity layer for Corvus — transforming it from a raw capture tool into an intentional, productive, and shareable knowledge-management system.

### Strategic Rationale

Corvus currently solves the problem of saving things users want but provides no signals about relevance, urgency, or progress. Users accumulate items with no friction and have no mechanism to act on them efficiently. These features address four strategic gaps:

1. **Data quality** — Duplicate detection and URL auto-fetch reduce noise and manual entry effort.
2. **Actionability** — Status and priority fields give users a workflow layer on top of raw capture.
3. **Discoverability and speed** — The recently added widget and command palette surface items and actions without navigation.
4. **Shareability and portability** — Public share links and export/import unlock collaborative and archival workflows.

### Success Metrics Summary

| Metric                                        | Baseline (today)       | 90-day target after launch       |
| --------------------------------------------- | ---------------------- | -------------------------------- |
| Duplicate link saves per day                  | Unknown (no detection) | Near zero occurrences            |
| Items with status set (% of total items)      | 0%                     | >= 40%                           |
| Items with priority set (% of total items)    | 0%                     | >= 30%                           |
| Add-item form completion time (median)        | Measured at launch     | Reduced by >= 20% via auto-fetch |
| Command palette opens per active user per day | 0                      | >= 3                             |
| Export operations per month                   | 0                      | >= 50 across user base           |
| Public share links created per month          | 0                      | >= 20                            |

---

## 2. Current State and Problem Statement

### Architecture Snapshot

The production system comprises three artifacts:

- **`apps/api`** — A Hono application deployed as a Cloudflare Worker. All data access is through a single `/graphql` endpoint (GraphQL Yoga + `@graphql-tools/schema`). The schema is defined in `apps/api/src/graphql/schema.graphql`; resolvers map to `WishlistService` methods in `apps/api/src/lib/wishlist/service.ts`. The Drizzle ORM schema lives in `apps/api/src/lib/db/schema.ts` and drives D1 SQLite migrations stored under `apps/api/drizzle/`.
- **`apps/web`** — A SolidStart application. State is managed through TanStack Query hooks (`apps/web/src/lib/graphql/hooks/use-wishlist.ts`). UI components live in `apps/web/src/components/`. Shared GraphQL operation strings and client-side types live in `packages/common/src/graphql/`.
- **`apps/extension`** — A WXT-based browser extension sharing the `@repo/common` GraphQL client.

### Current Data Model (Abridged)

The `wishlist_items` table in `apps/api/src/lib/db/schema.ts` contains:

```sql
id            TEXT  PRIMARY KEY
user_id       TEXT  NOT NULL
category_id   TEXT  (nullable FK → wishlist_categories.id, SET NULL on delete)
title         TEXT  NOT NULL
description   TEXT  (nullable, plain text only)
favicon       TEXT  (nullable)
created_at    TEXT  NOT NULL
updated_at    TEXT  NOT NULL
```

The `wishlist_item_links` table provides the URL store:

```sql
id              TEXT  PRIMARY KEY
item_id         TEXT  NOT NULL FK → wishlist_items.id (CASCADE DELETE)
url             TEXT  NOT NULL
normalized_url  TEXT  NOT NULL  (normalized form of url for duplicate detection; indexed)
description     TEXT  (nullable)
is_primary      INTEGER (boolean)
created_at      TEXT  NOT NULL
updated_at      TEXT  NOT NULL
```

`wishlist_item_links.normalized_url` is already indexed, but there is still no uniqueness constraint preventing duplicate URLs within or across items. There is no status, priority, or notes field. There is no public-sharing mechanism and no export endpoint.

### Pain Points

1. Users add the same product URL under different item titles without knowing it already exists — producing redundant rows with no cross-reference.
2. Items have no lifecycle state. Once added, there is no way to mark an item as purchased or archived without deleting it, which destroys history.
3. There is no way to quickly recall the most recent additions without scrolling through a paginated list.
4. The description field is plain text. Structured notes (bullet lists, links, emphasis) require workarounds.
5. Adding a new item requires manually copying and pasting a title from the destination URL. There is no automation.
6. Power users rely on mouse navigation for every action. There are no keyboard shortcuts.
7. There is no mechanism to export data for backup, migration, or hand-off to another tool.
8. Items cannot be shared with others. A user who wants to send a gift-list to a friend must screenshot or copy text manually.

---

## 3. Goals and Success Metrics

### Primary Goals

- **G1** — Reduce duplicate item creation to near zero through proactive detection.
- **G2** — Add a lightweight task-management layer (status + priority) that enables users to act on their lists.
- **G3** — Accelerate item capture by auto-fetching URL metadata.
- **G4** — Surface recent activity without requiring the user to navigate.
- **G5** — Enable power users to operate the application entirely from the keyboard.
- **G6** — Ensure users never lose data through export/import capabilities.
- **G7** — Allow users to share curated lists with anyone, no login required.

### Success Criteria Per Goal

| Goal | Metric                                                                      | Target        |
| ---- | --------------------------------------------------------------------------- | ------------- |
| G1   | % of attempted duplicate link adds that are intercepted by warning          | >= 95%        |
| G2   | % of items with a non-default status within 60 days of feature launch       | >= 35%        |
| G3   | % of new items where title was auto-populated from URL                      | >= 60%        |
| G4   | Daily active usage of the recently-added widget (distinct users viewing it) | >= 50% of DAU |
| G5   | Command palette opens per active session (median)                           | >= 2          |
| G6   | Export operations completed per week                                        | >= 10         |
| G7   | Public share links created within 30 days of launch                         | >= 15         |

---

## 4. User Personas

### Persona A: The Active Collector ("Sam")

- **Profile:** 28-year-old professional. Saves products from multiple retail sites throughout the week. Maintains 5-8 categories. Uses Corvus on desktop primarily; occasionally through the browser extension.
- **Goals:** Quickly capture items without context-switching, know at a glance what they still want versus what they have bought, not duplicate effort.
- **Pain points today:** Has saved the same sneaker from three different tabs under three different item titles. Has no way to mark items as purchased. Has to scroll back to find what they added this morning.
- **Features relevant:** F-01, F-02, F-03, F-05, F-06.

### Persona B: The Researcher ("Jordan")

- **Profile:** 34-year-old who uses Corvus as a research and reference organiser — saving articles, tools, and products for evaluation. Writes detailed notes per item. Manages 10+ categories.
- **Goals:** Rich, structured notes per item; fast navigation; ability to share a curated list with collaborators.
- **Pain points today:** Plain-text description is not expressive enough. There is no keyboard-driven workflow.
- **Features relevant:** F-04, F-06, F-07, F-08.

### Persona C: The Gift-Giver ("Taylor")

- **Profile:** 42-year-old who builds wish-lists to share with family before birthdays and holidays. Cares about ease of sharing and that recipients do not need accounts.
- **Goals:** One-click shareable link to a category (e.g., "Birthday Wish List"). Read-only view that looks good on mobile for recipients.
- **Pain points today:** Must screenshot or export manually. Recipients need no account.
- **Features relevant:** F-07, F-08.

### Persona D: The Power User ("Alex")

- **Profile:** 26-year-old developer who built their own workflows around Corvus. Wants to automate data extraction. Uses keyboard shortcuts in every tool.
- **Goals:** CSV export for spreadsheet workflows, JSON export for scripting, command palette for zero-mouse operation.
- **Features relevant:** F-06, F-07.

---

## 5. Feature Specifications

---

### F-01: Duplicate URL Detection

#### Feature Overview

When a user adds a URL to a new or existing item, the system checks whether that exact URL already exists on another item in the user's wishlist. If a duplicate is found, the user is shown a non-blocking warning identifying the conflicting item by name, with an option to proceed anyway or cancel.

#### User Story

As Sam (Active Collector), when I type or paste a URL into the Add Item dialog, I want to be warned immediately if that URL is already attached to one of my existing items, so that I do not create duplicate entries accidentally.

#### Acceptance Criteria

1. When a URL field in `AddItemDialog` or `LinkManager` loses focus or the user stops typing for 400 ms, a background check is triggered.
2. The check queries the user's links server-side; the client does not need to hold an in-memory index.
3. If the URL exists on a different item, an inline warning appears below the input field: "This URL is already saved under '[item title]'." The item title is a clickable link that opens the `ViewItemDialog` for that item.
4. If the URL exists on the same item being edited (edit flow), no warning is shown.
5. The warning is dismissible; the user may proceed to save with the duplicate URL.
6. If no duplicate is found, no UI change occurs.
7. The check is user-scoped: two different users saving the same URL is not flagged.
8. The feature works in both the web app and the browser extension.

#### Technical Requirements

**API changes — `apps/api/src/graphql/schema.graphql`:**

Add a new query:

```graphql
type DuplicateUrlCheckResult {
  isDuplicate: Boolean!
  conflictingItem: WishlistItem
}

type Query {
  # ... existing queries
  checkDuplicateUrl(url: String!, excludeItemId: ID): DuplicateUrlCheckResult!
}
```

**Service changes — `apps/api/src/lib/wishlist/service.ts`:**

Add method `checkDuplicateUrl(userId: string, url: string, excludeItemId?: string)` that queries `wishlist_item_links` joining to `wishlist_items` where `wishlist_items.user_id = userId AND wishlist_item_links.normalized_url = <normalized input>`. The input URL should be normalized using `normalizeHttpUrl` before comparison. The `excludeItemId` parameter filters out the current item during edit flows.

A database index on `wishlist_item_links.normalized_url` should be added via a new Drizzle migration (`apps/api/drizzle/`) to support efficient lookups. The index does not need to be unique because duplicate storage across items may be intentional. The backfill script at `apps/api/scripts/backfill-normalized-urls.ts` populates existing rows before the index is created.

**GraphQL resolver — `apps/api/src/graphql/resolvers.ts`:**

Add a `checkDuplicateUrl` resolver that requires authentication and delegates to the service method. Returns the conflicting `WishlistItem` (mapped via `mapItem`) or `null`.

**Shared operations — `packages/common/src/graphql/operations/wishlist.ts`:**

Add `CHECK_DUPLICATE_URL_QUERY` string. The query must select the conflicting item's `id`, `title`, and `categoryId` at minimum.

**Web app — `apps/web/src/components/LinkManager.tsx` and `useLinkManager.ts`:**

Add debounced duplicate-check call triggered by URL field `onInput`. The `useLinkManager` hook should accept an optional `onDuplicateFound` callback. The `LinkManager` component renders the inline warning conditionally.

**TanStack Query integration:**

Add a `useCheckDuplicateUrl` hook in `apps/web/src/lib/graphql/hooks/use-wishlist.ts` using `createQuery` with `enabled: !!url && url.length > 8` to avoid spurious requests on partial input.

#### Dependencies and Risks

- **Dependency:** No schema migration is needed for the item/link tables themselves; only an additional index and GraphQL additions.
- **Risk:** Debounce timing. Too short (< 200 ms) floods D1; too long (> 800 ms) feels unresponsive. Recommended: 400 ms debounce with a minimum URL length of 8 characters before triggering.
- **Risk:** The `wishlist_item_links` table has no `normalized_url` index today. Without it, the check performs a full table scan against the user's links. The index migration must land before the feature is enabled in production. Run the `backfill-normalized-urls.ts` script to populate existing rows before creating the index.
- **Extension consideration:** The extension's `LinkManager` equivalent should also receive this check. The shared `@repo/common/graphql/operations/wishlist.ts` operation string makes this straightforward.

---

### F-02: Item Status and Priority Tracking

#### Feature Overview

Each wishlist item gains two new optional fields: `status` (an enum of `want`, `purchased`, `archived`) and `priority` (an integer 1–5, where 1 is highest). The dashboard gains filter/sort controls for both. Items with status `archived` are hidden from the default view unless the user explicitly opts in.

#### User Story

As Sam (Active Collector), I want to mark items as "purchased" after I buy them and "archived" when I no longer want them, so that my active list stays clean while history is preserved.

As Jordan (Researcher), I want to assign priority levels 1–5 to items so that I can surface high-priority items at the top of the list.

#### Acceptance Criteria

1. `status` can be one of: `want` (default), `purchased`, `archived`.
2. `priority` is an optional integer 1–5 (null means unset). The UI renders it as a star or numeric badge.
3. The `EditItemDialog` exposes both fields. The `AddItemDialog` exposes `priority` and defaults `status` to `want`.
4. The `WishlistFilters` component gains a "Status" filter (dropdown: All / Want / Purchased / Archived) and the sort dropdown gains "Sort by Priority".
5. Items with status `archived` are excluded from the default query (`status != 'archived'`) unless the user selects the "Archived" filter option.
6. The dashboard item card renders a subtle status badge (colour-coded pill) and priority indicator.
7. The `wishlist` GraphQL query accepts `status` and `priority` filter/sort inputs.
8. Existing items with no explicit status value read as `want` through a default at the database level.

#### Technical Requirements

**Database migration — `apps/api/drizzle/`:**

Add migration files generated via `bun db:gen` from the updated Drizzle schema — `0006_url_index.sql` (URL index) and `0007_item_status_priority.sql` (status/priority columns):

```typescript
// apps/api/src/lib/db/schema.ts additions to wishlistItems table
status: text("status", { enum: ["want", "purchased", "archived"] })
    .notNull()
    .default("want"),
priority: integer("priority"),
```

Add a check constraint `CHECK (priority IS NULL OR (priority >= 1 AND priority <= 5))` in the raw SQL migration.

Add an index on `wishlist_items.status` to support efficient filtering of archived items.

**GraphQL schema — `apps/api/src/graphql/schema.graphql`:**

```graphql
enum ItemStatus {
  WANT
  PURCHASED
  ARCHIVED
}

type WishlistItem {
  # ... existing fields
  status: ItemStatus!
  priority: Int
}

input ItemInput {
  # ... existing fields
  status: ItemStatus
  priority: Int
}

input ItemUpdateInput {
  # ... existing fields
  status: ItemStatus
  priority: Int
}

input WishlistFilterInput {
  # ... existing fields
  status: ItemStatus
  priorityMin: Int
  priorityMax: Int
}

enum WishlistSortKey {
  CREATED_AT
  UPDATED_AT
  NAME
  TITLE
  PRIORITY # new
}
```

**Service changes — `apps/api/src/lib/wishlist/service.ts`:**

Update `buildItemFilters` to handle `status` and priority range filters. Extend `getSortColumn` in `getUserItems` to handle `PRIORITY` sort key (NULL last, ascending for priority 1 being highest). Update `createItem` and `updateItem` signatures to pass through the new fields.

**GraphQL types — `packages/common/src/graphql/types.ts`:**

Add `status: 'WANT' | 'PURCHASED' | 'ARCHIVED'` and `priority: number | null` to `GraphQLWishlistItem`. Add corresponding input type fields.

**Record types — `packages/common/src/types/wishlist-record.ts`:**

Add `status: 'want' | 'purchased' | 'archived'` and `priority?: number` to `WishlistItemRecord`.

**Adapter — `apps/web/src/lib/graphql/adapters.ts`:**

Update `adaptItem` to map `status` (lowercase conversion from GraphQL enum) and `priority`.

**UI — `apps/web/src/components/`:**

- `AddItemDialog.tsx`: Add priority selector (dropdown 1–5 with "Unset" option).
- `EditItemDialog.tsx`: Add status radio group (`Want` / `Purchased` / `Archived`) and priority selector.
- `WishlistDashboard.tsx` / `SortableWishlistItem`: Render a status pill badge and priority badge on item cards.
- `WishlistFilters.tsx`: Add status filter dropdown and update sort options to include Priority.

**Shared operations — `packages/common/src/graphql/operations/wishlist.ts`:**

Update `WISHLIST_QUERY`, `CREATE_ITEM_MUTATION`, and `UPDATE_ITEM_MUTATION` to include `status` and `priority` fields.

#### Dependencies and Risks

- **Dependency:** Database migration must run before any API deploy. Rollback plan: the migration adds nullable-with-default columns only; reverting is a no-op migration dropping the columns (data loss acceptable since no items will have non-default values until the feature ships).
- **Risk:** The existing `WishlistSortKey` GraphQL enum is code-generated via `graphql-codegen` (`apps/api/codegen.ts`). The `PRIORITY` variant must be added to the schema before running codegen.
- **Risk:** Existing items will have `status = 'want'` by default. Filter logic must treat `null` in older rows as `want` during any transition period before the migration runs on production.
- **Extension consideration:** The extension's item display should show the status badge. Priority does not need to be editable from the extension in the initial release.

---

### F-03: Recently Added Widget

#### Feature Overview

A persistent section at the top of the dashboard's right-hand content area shows the last 5–10 items added across all categories, with relative timestamps ("2 hours ago", "yesterday"). Clicking an item opens the `ViewItemDialog`.

#### User Story

As Sam (Active Collector), I want to see what I recently added at the top of my dashboard without changing my active category filter, so that I can quickly revisit items I captured today.

#### Acceptance Criteria

1. The widget shows the most recently created 5 items (configurable, hard-coded initially) ordered by `created_at DESC`.
2. Each row shows: item title, category name (or "Uncategorized"), and a relative timestamp.
3. Clicking any row opens `ViewItemDialog` for that item.
4. The widget is always visible regardless of the active category filter or search state.
5. If fewer than 5 items exist across the whole wishlist, the widget shows all of them.
6. If no items exist, the widget is hidden entirely (no empty-state text clutters the fresh-user experience).
7. The widget refreshes automatically when the main wishlist query cache is invalidated (i.e., after adding, editing, or deleting an item).
8. Timestamps use relative format ("just now", "3 minutes ago", "2 days ago") with an absolute tooltip on hover.

#### Technical Requirements

**API — dedicated `recentItems` query.**

We implement a new `recentItems(limit: Int): [WishlistItem!]!` GraphQL query for the widget. This avoids fetching categories and pagination metadata that the existing `wishlist` query returns. The backend work is still low complexity, but it does require a service-layer `getRecentItems` method, resolver wiring in `apps/api/src/graphql/resolvers.ts`, and unit tests or API documentation updates so the endpoint stays discoverable. The existing `wishlist` query and `wishlist_items_user_id_idx` index remain available for the main list view but are not used by the widget, and no DB schema changes are required for this feature.

**GraphQL schema — `apps/api/src/graphql/schema.graphql`:**

```graphql
type Query {
  # ... existing queries
  recentItems(limit: Int): [WishlistItem!]!
}
```

**Service — `apps/api/src/lib/wishlist/service.ts`:**

Add `getRecentItems(userId: string, limit: number = 5)` that runs `getUserItems` with `limit` and `sortBy: CREATED_AT, sortDir: DESC`, then fetches links for those items.

**Shared operations — `packages/common/src/graphql/operations/wishlist.ts`:**

Add `RECENT_ITEMS_QUERY` string selecting `id`, `title`, `categoryId`, `createdAt`, and enough link data to show the primary URL.

**TanStack Query hook — `apps/web/src/lib/graphql/hooks/use-wishlist.ts`:**

Add `useRecentItems(limit?: Accessor<number>)` hook with query key `["wishlist", "recent"]`. The query should be invalidated whenever the `["wishlist"]` key is invalidated, which TanStack Query handles transitively via the parent key prefix.

**UI — `apps/web/src/components/`:**

Create `RecentItemsWidget.tsx` as a new component. It receives the categories array (already loaded by `WishlistDashboard`) to resolve category names client-side. The component uses `@repo/ui-components/card` consistent with existing card usage in `WishlistDashboard.tsx`.

Insert the widget in `WishlistDashboard.tsx` immediately above the `WishlistItemsSection`, inside the `lg:col-span-3` column.

**Relative timestamp utility — `packages/common/src/utils/`:**

Add a `formatRelativeTime(isoString: string): string` utility function. This keeps the logic out of the component and shareable with the extension.

#### Dependencies and Risks

- **Dependency:** Requires the `categories` accessor already computed in `WishlistDashboard.tsx` to be passed as a prop. No new data fetch is needed for categories.
- **Risk:** Adding a second query on the dashboard page doubles the GraphQL round-trips on load. Mitigation: the `recentItems` query is lightweight (5 rows, no pagination metadata). Consider using `staleTime: 30_000` on the TanStack Query hook to reduce refetches on tab focus.
- **Risk:** Category name resolution on the client side requires the categories to be loaded first. Use `createMemo` with a fallback to "Uncategorized" to avoid a flash.

---

### F-04: Per-Item Markdown Notes

#### Feature Overview

The `description` field on wishlist items is upgraded from a plain-text `<textarea>` to a markdown-enabled field. In view mode, rendered HTML is displayed. In edit mode, a raw markdown textarea is shown. The rendered output is sanitised before insertion into the DOM.

#### User Story

As Jordan (Researcher), I want to write structured notes for my items using markdown (bullet points, bold text, inline code, links) and have them rendered beautifully in the view dialog, so that my notes are readable and formatted.

#### Acceptance Criteria

1. In `ViewItemDialog`, the description is rendered as HTML from markdown source. Bold, italic, bullet lists, ordered lists, inline code, and hyperlinks are supported.
2. In `EditItemDialog` and `AddItemDialog`, the description field remains a `<textarea>` accepting raw markdown.
3. A small "Markdown supported" hint link below the textarea opens a brief syntax reference (tooltip or popover).
4. Rendered HTML is sanitised: only a safe allow-list of tags (`<p>`, `<strong>`, `<em>`, `<ul>`, `<ol>`, `<li>`, `<code>`, `<pre>`, `<a>`, `<br>`, `<h1>`–`<h4>`) and attributes (`<a href>`, `<a target>`, `<a rel>`) are permitted. All `<a>` tags receive `rel="noopener noreferrer"`.
5. The textarea in edit mode preserves whitespace and indentation for a comfortable markdown authoring experience.
6. Existing plain-text descriptions render correctly (plain text is valid markdown).
7. There is no database schema change. `description` remains a `TEXT` column storing raw markdown source.

#### Technical Requirements

**No API or schema changes are required.** The description field already accepts arbitrary text. Markdown parsing and rendering are entirely client-side concerns.

**Library selection — `apps/web/package.json`:**

Add `marked` (a lightweight CommonMark-compliant markdown parser, ~20 kB minified) and `dompurify` (HTML sanitiser). Both are well-maintained and have no Cloudflare Workers dependency.

```bash
bun add marked dompurify
bun add -d @types/dompurify
```

**Utility — `apps/web/src/lib/markdown.ts`** (new file):

```typescript
import { marked } from "marked";
import DOMPurify from "dompurify";

const ALLOWED_TAGS = [
  "p",
  "strong",
  "em",
  "ul",
  "ol",
  "li",
  "code",
  "pre",
  "a",
  "br",
  "h1",
  "h2",
  "h3",
  "h4",
  "blockquote",
];
const ALLOWED_ATTR = ["href", "target", "rel"];

export function renderMarkdown(source: string): string {
  const rawHtml = marked.parse(source, { async: false }) as string;
  return DOMPurify.sanitize(rawHtml, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ADD_ATTR: ["target"],
  });
}
```

All `<a>` elements should have `rel="noopener noreferrer"` and `target="_blank"` forced via a `marked` renderer hook before sanitisation.

**UI — `apps/web/src/components/ViewItemDialog.tsx`:**

Replace the plain-text `<p>` for the description with a SolidJS `innerHTML` binding:

```tsx
<div
  class="prose prose-sm dark:prose-invert max-w-none"
  innerHTML={renderMarkdown(props.item.description)}
/>
```

The `prose` Tailwind typography class requires adding `@tailwindcss/typography` to the web app. If that plugin is not added, provide equivalent explicit CSS styles in `apps/web/src/app.css`.

**UI — `apps/web/src/components/AddItemDialog.tsx` and `EditItemDialog.tsx`:**

Add a "Markdown supported" helper text below the description textarea. No functional change to the textarea itself is required.

**Extension consideration:** The extension's item detail view should also render markdown using the same `renderMarkdown` utility. Place the utility in `packages/common/src/utils/markdown.ts` rather than `apps/web/src/lib/` to allow sharing. DOMPurify requires a DOM environment; the extension popup runs in a browser context so this is safe.

#### Dependencies and Risks

- **Risk:** `DOMPurify` requires `window.document` to be available. This is satisfied in the browser app and extension popup but would fail in SSR context. SolidStart's SSR rendering for the dashboard route must either disable server-side rendering of markdown content (render `null` or the raw text server-side, hydrate on the client) or use a server-safe sanitiser. The simplest approach is to wrap `renderMarkdown` with an `isServer` guard from `@solidjs/start` and return the raw source on the server.
- **Risk:** Tailwind's `prose` classes require `@tailwindcss/typography`. Verify the plugin is not already a devDependency in the monorepo's root Tailwind config before adding.
- **Dependency:** No backend changes; the `description TEXT` column already supports arbitrary-length text. There is no length limit currently.

---

### F-05: URL Metadata Auto-Fetch

#### Feature Overview

When a user types or pastes a URL into the primary URL field of the Add Item dialog, the API fetches the URL's `<title>` tag and `og:image` meta tag. The title is offered to the user as a pre-filled value for the item's title field, and the `og:image` is stored in `wishlist_items.og_image` for thumbnail display. The user can accept, edit, or ignore the suggestion.

#### User Story

As Sam (Active Collector), when I paste a product URL into the Add Item form, I want the item title to be automatically suggested from the page title, so that I do not have to manually type it out.

#### Acceptance Criteria

1. When a URL is entered in the primary URL field of `AddItemDialog` and the field loses focus (or 800 ms after typing stops), a loading spinner appears and the title field shows a "Fetching…" placeholder.
2. If the fetch succeeds and the title field is currently empty or still has the default value, the fetched page title is pre-filled into the title field. The user can overwrite it.
3. If an `og:image` URL is returned and is a valid absolute URL, it is stored in `wishlist_items.og_image` and used for thumbnail rendering. `wishlist_items.favicon` remains reserved for small site icons.
4. If the fetch fails (network error, timeout after 5 s, non-HTML content type, or the URL is localhost/private IP), no error is shown to the user and the title field remains editable.
5. The feature is rate-limited on the server: a single user cannot trigger more than 20 metadata fetch requests per minute.
6. The fetch is performed server-side (via the API worker) to avoid CORS restrictions and to protect the user's IP address.
7. The feature does not apply to additional (non-primary) URL fields in `LinkManager`.

#### Technical Requirements

**API — new Cloudflare Worker fetch utility:**

The metadata fetch runs in the Hono/Cloudflare Worker context using the native `fetch` API, which is available in Workers without restrictions.

**GraphQL schema — `apps/api/src/graphql/schema.graphql`:**

```graphql
type UrlMetadata {
  title: String
  ogImage: String
  fetchedAt: String!
}

type Query {
  # ... existing queries
  fetchUrlMetadata(url: String!): UrlMetadata
}
```

**New service — `apps/api/src/lib/url-metadata/service.ts`:**

```typescript
export interface UrlMetadata {
  title: string | null;
  ogImage: string | null;
  fetchedAt: string;
}

export async function fetchUrlMetadata(url: string): Promise<UrlMetadata> {
  // Validate URL is not private/localhost before fetching
  // Fetch with a 5s timeout and "text/html" Accept header
  // Parse <title> and <meta property="og:image"> from the response body
  // Return sanitised results
}
```

The implementation uses `new URL(url)` to validate the URL, then uses `fetch(url, { signal: AbortSignal.timeout(5000) })`. The response body is read up to 100 kB and parsed for `<title>` and `og:image` using a lightweight string search (no full HTML parser dependency to keep the Worker bundle small). The `og:image` URL must be an absolute URL before being returned and persisted to `wishlist_items.og_image`.

Private IP ranges (10.x.x.x, 172.16–31.x.x, 192.168.x.x), localhost, and `.local` domains must be blocked to prevent SSRF.

**Rate limiting:** Use Cloudflare's `c.env.DB` or a simple in-memory Map (acceptable for single-instance dev, insufficient for production). For production, use a Cloudflare KV store with a TTL-based counter per user ID. The rate limit endpoint binding must be added to `wrangler.jsonc`.

**Resolver — `apps/api/src/graphql/resolvers.ts`:**

Add `fetchUrlMetadata` resolver. Authentication required. Delegates to the service function.

**TanStack Query hook — `apps/web/src/lib/graphql/hooks/use-wishlist.ts`:**

Add `useFetchUrlMetadata(url: Accessor<string>)` with `enabled: !!url() && isValidUrl(url())` and `staleTime: 5 * 60 * 1000` (5 minutes — the same URL fetched twice within 5 minutes returns the cached result without a new Worker fetch).

**UI — `apps/web/src/components/AddItemDialog.tsx`:**

The primary URL input field triggers `useFetchUrlMetadata` when the URL changes and passes a clean URL. On success, if `title()` signal is empty, call `setTitle(metadata.title)`. Show a subtle "Title suggested from URL" hint text under the title field when auto-populated, with an undo affordance (reset to empty).

#### Dependencies and Risks

- **Risk:** SSRF. The server-side fetch service must block private IP ranges and localhost. This is a security requirement, not a nice-to-have.
- **Risk:** Many websites block bots by User-Agent or require JavaScript rendering. The feature should set a neutral `User-Agent` header (`Corvus/1.0`) and gracefully degrade when sites return 403 or non-HTML responses.
- **Risk:** Response body size. Some pages have very large `<head>` sections. Capping the read at 100 kB and using an early-exit parser avoids Worker memory issues.
- **Risk:** Production rate limiting requires a Cloudflare KV namespace. This must be provisioned before production deployment and added as a binding in `wrangler.jsonc`.
- **Dependency:** A new `og_image TEXT` column will be added to `wishlist_items` to store full-size Open Graph images, keeping `wishlist_items.favicon` reserved for small favicons (16–32px). This avoids overloading the `favicon` column with a different semantic meaning. The migration is low-risk — a single nullable `og_image TEXT` column addition.

---

### F-06: Keyboard Shortcut System and Command Palette

#### Feature Overview

A global command palette (opened via Cmd/Ctrl+K) provides text-filtered access to all major application actions. A secondary set of single-key shortcuts provides direct access to high-frequency actions when no input field is focused.

#### User Story

As Alex (Power User), I want to open a command palette with Cmd+K to search for and trigger any action in the application without lifting my hands from the keyboard, so that I can operate Corvus entirely without a mouse.

As Jordan (Researcher), I want to press N to open the new item dialog and / to focus the search box from anywhere on the dashboard, so that item capture and retrieval are instant.

#### Acceptance Criteria

**Command Palette:**

1. Cmd+K (Mac) or Ctrl+K (Windows/Linux) opens the command palette from anywhere on the dashboard.
2. The palette displays a text search input and a list of available commands.
3. Typing filters commands by label using fuzzy or prefix matching.
4. Commands include at minimum: "Add new item", "Manage categories", "Search items", "Export wishlist (JSON)", "Export wishlist (CSV)", "Toggle dark/light theme", "Sign out".
5. Arrow keys navigate the command list. Enter activates the highlighted command. Escape closes the palette.
6. The palette traps focus while open; background content is not interactive.
7. The palette is accessible: `role="dialog"`, `aria-modal="true"`, focus management on open/close.

**Single-key shortcuts (active when no input is focused):**

| Key    | Action                                      |
| ------ | ------------------------------------------- |
| N      | Open Add Item dialog                        |
| /      | Focus the search input in `WishlistFilters` |
| Escape | Close any open dialog or command palette    |

8. Shortcuts are suppressed when the user is typing in any `<input>`, `<textarea>`, or `<select>` element.

#### Technical Requirements

**Global keyboard listener — `apps/web/src/hooks/useKeyboardShortcuts.ts`** (new file):

A SolidJS hook that registers `document.addEventListener("keydown", ...)` on mount and cleans up on unmount. The handler checks whether the active element is an interactive element before processing single-key shortcuts.

```typescript
export function useKeyboardShortcuts(handlers: ShortcutHandlers) {
  onMount(() => {
    document.addEventListener("keydown", handleKeyDown);
  });
  onCleanup(() => {
    document.removeEventListener("keydown", handleKeyDown);
  });
}
```

**Command Palette component — `apps/web/src/components/CommandPalette.tsx`** (new file):

The component is rendered inside `WishlistDashboard` and is conditionally visible based on a `paletteOpen` signal. It uses a portal (`<Portal>`) to render at the document body level above all other content. The component follows the existing modal pattern from `AddItemDialog.tsx` (fixed inset overlay with backdrop).

Commands are modelled as an array of `{ id, label, category, action }` objects composed in `WishlistDashboard.tsx` and passed as a prop to `CommandPalette`. This keeps commands co-located with the handlers they invoke.

**Filter logic:**

Simple case-insensitive substring filter is sufficient for the initial release. No external fuzzy-search library is required.

**Shortcut integration in `WishlistDashboard.tsx`:**

```typescript
useKeyboardShortcuts({
  "mod+k": () => setPaletteOpen(true),
  n: () => setAddOpen(true),
  "/": () => searchInputRef?.focus(),
  escape: () => {
    setPaletteOpen(false);
    setAddOpen(false); /* etc */
  },
});
```

**Search input ref:**

`WishlistFilters.tsx` currently does not expose a ref. Add an optional `inputRef` prop of type `(el: HTMLInputElement) => void` to allow the parent to capture the element reference.

**Extension consideration:** The extension operates as a browser extension popup, not a full-page application. The command palette is out of scope for the extension. Single-key shortcuts are also out of scope there because the popup is small and keyboard navigation is already straightforward.

#### Dependencies and Risks

- **Risk:** Shortcut conflicts with browser defaults. The `/` key has no default browser action in most contexts. `N` has no default action. `Cmd+K` is commonly used by browser dev tools in some browsers; this is acceptable as it only applies when the Corvus tab is focused and the dev tools overlay is not open.
- **Risk:** Accessibility. The command palette must implement proper focus trapping and restore focus to the previously focused element on close. Use a `createEffect` that saves `document.activeElement` before opening and restores it after closing.
- **Dependency:** Requires F-07 (Export) commands to be available in the palette. The palette command list should be composed after F-07 is implemented; the palette itself can ship without export commands in a pre-F-07 release.

---

### F-07: Export and Import (JSON and CSV)

#### Feature Overview

Users can export their entire wishlist or a single category as a JSON or CSV file. They can also import a previously exported JSON file, with duplicate detection (by URL or by title+category combination) preventing re-creation of already-existing items.

#### User Story

As Alex (Power User), I want to export my entire wishlist as a CSV so that I can open it in a spreadsheet and perform analysis or share it with others who prefer that format.

As Taylor (Gift-Giver), I want to export a single category as JSON so that I can back it up before deleting old items.

As Jordan (Researcher), I want to import a JSON backup to restore items I accidentally deleted.

#### Acceptance Criteria

**Export:**

1. The dashboard header or a new "Export" action in the command palette and a menu item exposes "Export All (JSON)", "Export All (CSV)", "Export Category (JSON)", and "Export Category (CSV)" actions.
2. For category-scoped export, the active category filter determines the scope. If "All Items" is selected, the full wishlist is exported.
3. JSON export format:
   ```json
   {
     "exportedAt": "2026-03-24T10:00:00Z",
     "version": 1,
     "categories": [{ "id": "...", "name": "...", "color": "..." }],
     "items": [
       {
         "id": "...",
         "title": "...",
         "description": "...",
         "status": "want",
         "priority": null,
         "categoryId": "...",
         "categoryName": "...",
         "createdAt": "...",
         "links": [{ "url": "...", "description": "...", "isPrimary": true }]
       }
     ]
   }
   ```
4. CSV export includes columns: `id`, `title`, `description`, `status`, `priority`, `category`, `primaryUrl`, `allUrls` (semicolon-separated), `createdAt`.
5. The file is downloaded directly by the browser (no server involvement required for export).
6. Export is triggered entirely client-side using the existing TanStack Query cache or a fresh fetch of all pages.

**Import:**

7. An "Import" button opens a file picker accepting `.json` files only.
8. The JSON is validated against the expected schema before any mutations are sent.
9. For each item in the import file, the system checks whether any of its URLs already exist in the user's wishlist (re-using F-01 logic). If a duplicate URL is found, the item is skipped and listed in a post-import summary.
10. Items with no URL overlap and titles not matching any existing item title in the same category are created.
11. Categories named in the import file are created if they do not already exist (case-insensitive match on name). Existing category IDs from the import file are ignored; categories are matched or created by name.
12. The import runs one item at a time via the existing `createItem` and `addItemLink` mutations (no new bulk-import mutation is required for the initial release, though one would improve performance).
13. A post-import summary dialog shows: items imported, items skipped (with reasons), categories created.

#### Technical Requirements

**Client-side export utility — `apps/web/src/lib/export.ts`** (new file):

```typescript
export function exportAsJson(data: WishlistDataRecord, filename: string): void;
export function exportAsCsv(data: WishlistDataRecord, filename: string): void;
```

Both functions build a `Blob` and trigger download via `URL.createObjectURL` + a hidden `<a>` click. No server round-trip.

For large wishlists that span multiple pages, the export function must fetch all pages. This requires calling the `getWishlist` function with a large `pageSize` (up to the 50-item maximum per the resolver) and paginating through all pages. This is the highest-complexity part of the export implementation.

**Client-side import utility — `apps/web/src/lib/import.ts`** (new file):

```typescript
export interface ImportResult {
  imported: number;
  skipped: number;
  skippedItems: Array<{ title: string; reason: string }>;
  categoriesCreated: number;
}

export async function importFromJson(
  file: File,
  api: WishlistAPI,
): Promise<ImportResult>;
```

**UI — `apps/web/src/components/ExportImportMenu.tsx`** (new file):

A dropdown menu component rendered in the dashboard header next to "Add Item". Opens inline with export/import options. The import option shows a hidden `<input type="file" accept=".json">`.

**Import progress dialog — `apps/web/src/components/ImportProgressDialog.tsx`** (new file):

Shows a progress bar during import (based on items processed / items total) and displays the `ImportResult` summary on completion.

**Command palette integration:** Export actions (JSON and CSV, all and by category) are added as commands in the command palette after F-06 is implemented.

#### Dependencies and Risks

- **Risk:** Large wishlist exports. The current GraphQL API caps `pageSize` at 50 items per the resolver (`Math.min(..., 50)`). Exporting a wishlist with 500 items requires 10 sequential API calls. Consider either raising the cap for an export-specific query or adding a dedicated `exportWishlist` query that returns all items without pagination.
- **Risk:** CSV escaping. Descriptions containing commas, newlines, and quotes must be properly RFC 4180–compliant. Use a minimal CSV-serialisation utility rather than naive string concatenation.
- **Risk:** Import file size. A large JSON file could block the main thread. Use a Web Worker for the parse and validation step if import files exceed 1 MB.
- **Dependency:** F-01 (Duplicate URL Detection) service-layer logic should be factored so that the import pipeline can call the same duplicate-check without a separate network request per URL. The import service can load all existing link URLs into a `Set` once before processing the import file.
- **Dependency:** F-02 (Status and Priority) fields must be included in the export format even if the feature ships after F-07. Version the JSON format (`"version": 1`) to allow future compatibility.

---

### F-08: Shareable Public Wishlists

#### Feature Overview

Users can generate a read-only, publicly accessible share link for either a specific category or their entire wishlist. The link requires no authentication and renders a stripped-down read-only view. Users can revoke links at any time.

#### User Story

As Taylor (Gift-Giver), I want to generate a link to my "Birthday Wishes" category and send it to family members, who can view my list without needing a Corvus account.

As Jordan (Researcher), I want to share my "AI Tools" category with colleagues as a read-only reference list.

#### Acceptance Criteria

1. Each category gains a "Share" button in the `CategoryManager`.
2. An "Share All" option is available from the dashboard header or command palette.
3. Clicking "Share" creates a share token and displays the public URL (e.g., `https://corvus.example.com/share/[token]`).
4. The shared page is read-only: no add/edit/delete controls are shown.
5. The shared page is accessible without authentication.
6. The shared page shows: wishlist owner's display name (first name only), item titles, descriptions (rendered markdown for F-04 items), category name, and primary link for each item. Item IDs, user IDs, and internal metadata are not exposed.
7. Items with status `archived` (F-02) are excluded from the public view.
8. The token is a cryptographically random string (at least 128 bits of entropy, URL-safe base64).
9. Users can revoke a share link, which invalidates the token immediately.
10. A user can have at most one active share token per category and one for the full wishlist (subsequent "Share" actions regenerate the token, revoking the previous one). This is a simplification; multi-token support can be added later.
11. The public share page is responsive and renders correctly on mobile viewports.

#### Technical Requirements

**Database migration — `apps/api/drizzle/`:**

Add a new table `wishlist_share_tokens`:

```sql
CREATE TABLE wishlist_share_tokens (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  category_id TEXT REFERENCES wishlist_categories(id) ON DELETE CASCADE,
  -- NULL category_id means the token covers the full wishlist
  token TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at TEXT -- NULL means no expiry
);
CREATE INDEX wishlist_share_tokens_user_id_idx ON wishlist_share_tokens(user_id);
CREATE UNIQUE INDEX wishlist_share_tokens_user_scope_unique
  ON wishlist_share_tokens(user_id, category_id);
-- Note: the unique index on (user_id, category_id) enforces one token per scope.
-- NULL category_id must be handled: SQLite treats NULLs as distinct in unique indexes,
-- so a partial unique index or application-level enforcement is required for the full-wishlist case.
```

The unique constraint for `category_id IS NULL` requires application-level enforcement because SQLite does not include NULL in unique index comparisons. The service must `DELETE` any existing full-wishlist token for the user before inserting a new one.

Corresponding Drizzle schema entry in `apps/api/src/lib/db/schema.ts`:

```typescript
export const wishlistShareTokens = sqliteTable("wishlist_share_tokens", {
  id: text("id").primaryKey(),
  user_id: text("user_id").notNull(),
  category_id: text("category_id").references(() => wishlistCategories.id, {
    onDelete: "cascade",
  }),
  token: text("token").notNull().unique(),
  created_at: text("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  expires_at: text("expires_at"),
});
```

**GraphQL schema — `apps/api/src/graphql/schema.graphql`:**

```graphql
type ShareToken {
  id: ID!
  token: String!
  categoryId: String
  shareUrl: String!
  createdAt: String!
}

type PublicWishlistItem {
  id: ID!
  title: String!
  description: String
  categoryName: String
  primaryUrl: String
}

type PublicWishlistPayload {
  ownerName: String!
  categoryName: String
  items: [PublicWishlistItem!]!
}

type Query {
  # ... existing queries
  publicWishlist(token: String!): PublicWishlistPayload
}

type Mutation {
  # ... existing mutations
  createShareToken(categoryId: ID): ShareToken!
  revokeShareToken(id: ID!): Boolean!
}

# Add to existing authenticated Query:
  shareTokens: [ShareToken!]!
```

**Service — `apps/api/src/lib/wishlist/service.ts`:**

Add `createShareToken`, `revokeShareToken`, `getShareTokens`, and `getPublicWishlist` methods. The `getPublicWishlist` method takes a token string, validates it against the `wishlist_share_tokens` table, then fetches the associated items (filtering out `archived` status once F-02 is implemented) and returns only the safe public-facing fields.

Token generation uses `crypto.randomUUID()` (available in both the Cloudflare Workers runtime and browsers) combined with additional entropy:

```typescript
const token = btoa(
  Array.from(crypto.getRandomValues(new Uint8Array(24)))
    .map((b) => String.fromCharCode(b))
    .join(""),
).replace(/[+/=]/g, (c) => ({ "+": "-", "/": "_", "=": "" })[c]!);
```

**API routing — `apps/api/src/index.tsx`:**

Add a `GET /share/:token` endpoint that returns the public wishlist data as JSON (not through GraphQL) or redirects to the SolidStart share page. Using the GraphQL `publicWishlist` query is cleaner architecturally; the client-side share route fetches it via GraphQL without credentials.

**Web app — new route `apps/web/src/routes/share/[token].tsx`:**

A new SolidStart route that reads the `token` param and calls the `publicWishlist` GraphQL query without authentication. This page must have no auth guard and must be server-rendered for link-preview (og:meta) purposes.

**UI — share controls:**

- `CategoryManager.tsx`: Add a "Share" button per category row.
- New `ShareDialog.tsx` component: Shows the generated share URL with a copy-to-clipboard button, a QR code (optional for v1), and a "Revoke" button.
- Dashboard header: Add a "Share All" option.

**GraphQL operations — `packages/common/src/graphql/operations/wishlist.ts`:**

Add `PUBLIC_WISHLIST_QUERY`, `CREATE_SHARE_TOKEN_MUTATION`, `REVOKE_SHARE_TOKEN_MUTATION`, and `SHARE_TOKENS_QUERY` operation strings.

#### Dependencies and Risks

- **Risk:** Token guessing. The token must be at least 128 bits of random entropy. Using `crypto.randomUUID()` alone (122 bits) is borderline sufficient; the custom base64-encoded 192-bit token above is preferable.
- **Risk:** Deleted categories. If a category is deleted, the associated share token should also be deleted. The `ON DELETE CASCADE` on `wishlist_share_tokens.category_id` handles this.
- **Risk:** The `PUBLIC_WISHLIST_QUERY` is unauthenticated. The resolver must never expose user IDs, emails, or internal database IDs beyond what is in `PublicWishlistPayload`. Review the `publicWishlist` resolver carefully before shipping.
- **Risk:** SEO and og:meta. The share page must render server-side for link previews to work. Ensure the SolidStart route at `apps/web/src/routes/share/[token].tsx` uses `<Title>` and `<Meta>` from `@solidjs/meta` with the category name and owner name.
- **Risk:** SQLite NULL uniqueness. The application-level enforcement for the one-token-per-full-wishlist constraint must be within a transaction to prevent race conditions. Use `db.batch()` as the existing `createItemWithPrimaryLink` does in `WishlistService`.
- **Dependency:** F-02 (status field) must be implemented before the public view can correctly filter out archived items. If F-08 ships before F-02, the filter step is a no-op (no items will have `archived` status yet).

---

## 6. Implementation Roadmap

### Phasing Rationale

Features are grouped by dependency chains and risk profile. High-value, low-risk features ship first to deliver user value quickly and establish test coverage for the data model changes that more complex features require.

### Phase 1 — Foundation and Quick Wins (Sprints 1–2, estimated 2–3 weeks)

| Feature                       | Why first                                                                                                                                                                                                 |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F-01: Duplicate URL Detection | Pure additive: one new query, one index migration, one client-side hook. No schema changes to existing tables. High user value, low risk.                                                                 |
| F-03: Recently Added Widget   | Low complexity. Add the `recentItems` GraphQL query, its resolver wiring, and a service-layer `getRecentItems` method; no DB schema changes are required, but the endpoint still needs tests or API docs. |
| F-05: URL Metadata Auto-Fetch | Additive: new server-side utility + one GraphQL query + a nullable `wishlist_items.og_image` column for thumbnail storage.                                                                                |

**Deliverables:**

- Drizzle migration adding `wishlist_item_links.normalized_url` index.
- `checkDuplicateUrl` GraphQL query, resolver, and service method.
- Duplicate URL warning in `LinkManager.tsx` and `AddItemDialog.tsx`.
- `recentItems` GraphQL query, resolver, service method, and `RecentItemsWidget.tsx`, with tests or API docs updated for the endpoint.
- `fetchUrlMetadata` GraphQL query with server-side URL fetcher.
- Auto-populate title in `AddItemDialog.tsx`.

### Phase 2 — Data Model Expansion (Sprints 3–4, estimated 3–4 weeks)

| Feature                        | Why second                                                                                                                            |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| F-02: Item Status and Priority | Requires the most impactful database migration. Best done before export (F-07) so the export format is complete from day one.         |
| F-04: Per-Item Markdown Notes  | No database changes; purely client-side library additions. Ships in this phase because it is a natural companion to richer item data. |

**Deliverables:**

- Drizzle migration adding `status` and `priority` to `wishlist_items`.
- Updated GraphQL schema, resolvers, service, and shared types.
- Updated `AddItemDialog.tsx` and `EditItemDialog.tsx` with status/priority controls.
- Status badges and priority indicators on item cards.
- Status filter in `WishlistFilters.tsx`.
- `marked` + `DOMPurify` integration and `renderMarkdown` utility.
- Markdown rendering in `ViewItemDialog.tsx`.

### Phase 3 — Power User Features (Sprints 5–6, estimated 3–4 weeks)

| Feature                        | Why third                                                                                                                          |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| F-06: Keyboard Shortcut System | Depends on export commands existing (F-07) for a complete command palette. Can ship without export commands in a reduced-scope v1. |
| F-07: Export and Import        | Export format benefits from F-02 fields being available. Import re-uses F-01 duplicate-check logic.                                |

**Deliverables:**

- `useKeyboardShortcuts.ts` hook.
- `CommandPalette.tsx` component.
- N / / / Escape single-key shortcuts.
- Client-side JSON and CSV export utilities.
- `ExportImportMenu.tsx` in dashboard header.
- JSON import with duplicate detection and progress dialog.
- Export commands wired into command palette.

### Phase 4 — Sharing (Sprints 7–8, estimated 3–4 weeks)

| Feature                          | Why last                                                                                                                                                                                             |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F-08: Shareable Public Wishlists | Requires the most database schema additions (new table), a new unauthenticated route, and careful security review. Benefits from F-02 (archived filter) and F-04 (rendered markdown in public view). |

**Deliverables:**

- Drizzle migration for `wishlist_share_tokens` table.
- `createShareToken` and `revokeShareToken` mutations plus `publicWishlist` query.
- `ShareDialog.tsx` and share controls in `CategoryManager.tsx`.
- Public share route `apps/web/src/routes/share/[token].tsx`.
- Security review of `publicWishlist` resolver.
- Playwright E2E tests for the public share flow.

---

## 7. Non-Functional Requirements

### Performance

- **F-01 duplicate check:** Round-trip latency from URL input blur to warning display must be under 500 ms at median for users with up to 500 items. The index on `wishlist_item_links.normalized_url` is required to achieve this against D1.
- **F-05 metadata fetch:** The Cloudflare Worker fetch to the target URL must complete within the 5 s timeout. The Worker's CPU time limit is 10 ms per subrequest in the free tier; the fetch itself is wall-clock time and does not count against CPU limits.
- **F-07 export:** Exporting a wishlist of up to 200 items must complete within 5 seconds including all paginated API calls. For larger wishlists, a progress indicator must be shown.
- **F-08 public share page:** Initial server-rendered HTML for the public share page must be delivered in under 2 seconds (TTFB) from Cloudflare's edge.

### Security

- **F-05 (URL fetch):** SSRF mitigation is required. The server-side fetch must block private IP ranges (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16), loopback (127.0.0.0/8, ::1), and link-local (169.254.0.0/16, fe80::/10) addresses. Validate the URL scheme is `http` or `https` only.
- **F-08 (public sharing):** Token entropy must be at least 128 bits. The `publicWishlist` GraphQL resolver must be reviewed independently and must not expose any fields outside `PublicWishlistPayload`. No GraphQL introspection leakage.
- **All new mutations:** Must enforce the existing authentication pattern: check `context.user` and throw `UNAUTHENTICATED` if null, consistent with `apps/api/src/graphql/resolvers.ts`.

### Accessibility

- **F-06 (command palette):** Must implement `role="dialog"`, `aria-modal="true"`, `aria-label`, and focus trapping. The list items must have `role="option"` and `aria-selected`. The input must have `role="combobox"`.
- **F-02 (status/priority):** Status radio groups must use `<fieldset>` / `<legend>` with proper `aria-label`. Priority dropdowns must have visible labels.
- **F-08 (public page):** Must achieve WCAG 2.1 AA contrast ratios in both light and dark themes.

### Testing

All new features must include:

- **Unit tests** in `apps/api/tests/` using Vitest, consistent with the existing pattern of `tests/auth/service.test.ts` and related files. Service-layer methods must have 100% branch coverage for the new code paths.
- **Component tests** for new SolidJS components using `@solidjs/testing-library` and `jsdom`, consistent with `apps/web/src/components/*.test.tsx` files.
- **E2E tests** in `packages/e2e/tests/` using Playwright for the critical user flows: creating a duplicate URL and seeing the warning (F-01), marking an item as purchased (F-02), creating and visiting a public share link (F-08), and exporting/importing a wishlist (F-07).

### Browser and Device Compatibility

- Minimum supported: Chrome 120+, Firefox 120+, Safari 17+.
- The command palette and keyboard shortcuts must work consistently across macOS, Windows, and Linux.
- The public share page must render correctly on iOS Safari 16+ and Android Chrome 120+.

### Internationalisation

- All user-facing strings introduced in these features should be authored in English only for the initial release. No i18n framework is required. The relative timestamp utility (`formatRelativeTime`) should use the browser's `Intl.RelativeTimeFormat` API for future locale support, even if only `en` is used today.

---

## 8. Out of Scope

The following items are explicitly deferred:

1. **Real-time collaboration** on shared wishlists — the public share link is read-only in this release. Collaborative editing (multiple users modifying the same list) is a future feature requiring websockets or long-polling and a fundamentally different data model.
2. **Price tracking** — monitoring price changes for items linked to product pages is outside the scope of this release. It would require a persistent scheduler (Cloudflare Workers Cron Triggers), a price-parsing layer per retailer, and storage for price history.
3. **Notification system** — email or push notifications (e.g., "price dropped on item X") are out of scope.
4. **OAuth / social login** — the authentication system uses Supabase. Additional social providers are an independent concern.
5. **Multi-user shared wishlists (collaborative)** — distinct from read-only public sharing. Shared edit access requires a permissions model that does not exist today.
6. **Mobile native applications** — the browser extension covers mobile indirectly; a native iOS/Android app is a separate workstream.
7. **Drag-and-drop reordering of items** — the web app has `@dnd-kit` installed (`apps/web/package.json`) but reordering is not currently functional. Implementing saved custom sort order requires a `sort_order` column and service changes not covered in this PRD.
8. **AI-powered tagging or categorisation** — automatic category or tag suggestions from item titles or descriptions.
9. **Expiry dates on share tokens** — the schema supports `expires_at` but the UI for setting expiry is deferred to a follow-up release. All tokens created in F-08's initial release are non-expiring.
10. **Bulk import from third-party services** — importing from Amazon wish lists, Goodreads, or other platforms is not included.

---

_This document was authored based on a full read of the production codebase as of 2026-03-24, including `apps/api/src/graphql/schema.graphql`, `apps/api/src/lib/db/schema.ts`, `apps/api/src/lib/wishlist/service.ts`, `apps/api/src/graphql/resolvers.ts`, `apps/web/src/components/WishlistDashboard.tsx`, `apps/web/src/components/AddItemDialog.tsx`, `apps/web/src/components/EditItemDialog.tsx`, `apps/web/src/components/ViewItemDialog.tsx`, `packages/common/src/graphql/types.ts`, `packages/common/src/graphql/operations/wishlist.ts`, and related files. All file paths referenced are relative to the monorepo root `/Users/chanwaichan/workspace/corvus/`._
