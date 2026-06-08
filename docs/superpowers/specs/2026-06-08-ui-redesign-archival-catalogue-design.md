# UI Redesign — "Corvus, the Catalogue" (Warm Paper / Archival)

**Date:** 2026-06-08
**Status:** Approved (design)
**Scope:** Full UI redesign of the web app (all pages) plus shared design tokens, propagated to the browser extension.

## 1. Concept

A wishlist is a personal _catalogue of desire_. The entire app is redesigned to read like a beautifully typeset collector's catalogue / archival ledger on warm paper. The product name (Corvus — the crow constellation) becomes the recurring visual identity: a four-star **Corvus constellation glyph** plus a fine **feather** motif, used on auth pages, empty states, and as the favicon.

This replaces the current "AI-slop" aesthetic: purple→pink gradients on light backgrounds, translucent `backdrop-blur` cards, heavy `shadow-xl`, and emoji icons.

**Aesthetic direction:** Warm paper / archival catalogue. Light theme primary; dark (espresso) is the secondary theme. Full editorial layout (not just a reskin).

## 2. Design Language

### Typography (3 roles, self-hosted via `@fontsource`)

- **Fraunces** (`@fontsource-variable/fraunces`) — display & section headers. Variable serif, warm/editorial.
- **Newsreader** (`@fontsource/newsreader`) — item titles & body prose ("typeset catalogue" reading texture).
- **Spline Sans Mono** (`@fontsource-variable/spline-sans-mono`) — metadata, labels, counts, dates, page numbers, IDs (library index-card / ledger texture).

Self-hosted (not CDN) so the browser extension popup works offline and is CSP-safe.

### Color tokens

Light is primary; dark (espresso) is the secondary theme. Single sharp **oxblood** accent on warm neutrals.

```
LIGHT (primary)                          DARK (secondary, espresso)
--background  40 33% 94%   paper         --background  30 12% 8%
--card        42 44% 97%   card-stock    --card        30 10% 11%
--foreground  30 10% 12%   ink           --foreground  40 30% 90%   cream
--muted-fg    33 10% 40%                 --muted-fg    36 12% 60%
--primary     14 60% 32%   oxblood       --primary     14 65% 52%   (brightened)
--border      36 18% 82%   hairline      --border      30 8% 22%
--radius      0.125rem  (near-square, letterpress)
```

Accent reference: oxblood `#7E342A`. Used on CTAs, the active category marker, priority tags, and drawn hover underlines. Secondary/muted/accent/popover tokens recolored to warm neutrals consistent with the above. Destructive stays a distinct red but warm-toned.

### Texture & motion (CSS-only, restrained)

- Faint **paper grain** overlay via SVG `feTurbulence` data-URI at very low opacity; barely-there constellation mark in page corners.
- **Hairline rules instead of shadows** — remove all `shadow-xl` / `backdrop-blur`; structure comes from 1px warm-gray rules.
- One **orchestrated page-load**: staggered fade/rise (headers → rules → entries) via `animation-delay`.
- Hover: a hairline underline that _draws_ across links/rows.
- No scattered micro-interactions.
- All emoji icons (⚙️ ✏️ ×) replaced with thin inline **SVG line icons**.

## 3. Page-by-page Treatment

### Auth (`signin`, `signup`)

Centered, typeset like a title page: large Fraunces **"Corvus"** wordmark with the constellation glyph above it; a hairline-ruled card (no shadow/blur) holding the Google button restyled as a bordered oxblood-on-paper control; tagline in mono small-caps; faint paper grain + corner constellation. `login` / `register` remain redirect-only routes.

### Dashboard (`WishlistDashboard`)

- **Masthead** (replaces gradient header): oversized Fraunces `Corvus Wishlist`, a running rule, "Welcome back, {name}" in mono; theme toggle + Profile + Sign Out as understated text links with drawn underlines.
- **Sidebar = Table of Contents:** categories as a typeset index with leader dots (`Books ···· 12`); active category marked by an oxblood rule/marker (no pill gradient); settings as a thin SVG icon.
- **Items = catalogue entries** (not boxy cards): each a hairline-ruled entry with a left index number, Newsreader title, description prose, and a mono metadata line (`added 2026·03·12 · 2 links · P2`). Status as a small letterpress tag. Edit/delete become hairline SVG icons revealed on hover. Selection mode uses a square checkbox + accent rule.
- **Pagination** as a ledger footer: `Showing 1–10 of 42 · Page 1 / 5` in mono with text-link prev/next.
- **Empty/loading states:** editorial copy (e.g. "The catalogue is empty.") with the feather mark and a thin animated rule rather than a spinner.

### Profile (`profile`)

A "specimen record" / index card: Fraunces "Your Profile" header; fields (Name / Email / Member Since / Last Updated) as a typeset definition list with hairline rules and mono labels. Access-denied fallback gets the same paper treatment. Buttons restyled (oxblood primary, hairline outline).

### Dialogs (Add / Edit / View item, CategoryManager)

Hairline-framed paper panels; darkened-paper backdrop (no blue/black blur); Fraunces titles; mono field labels; restyled Input/Select/Button. The View dialog reads like a full catalogue entry.

### Shared bits

`BulkActionBar`, `WishlistFilters`, `RecentItemsWidget`, `LinkManager` reskinned to match (mono labels, hairline borders, SVG icons).

## 4. Architecture & Build Plan

Single source of truth for tokens lives in `packages/ui-components/src/styles.css`; both web and extension import `@repo/ui-components/styles`, and the extension reuses the shared Tailwind preset. The web app currently redefines colors directly in its own `tailwind.config.js`.

1. **Design tokens** — Rewrite `:root` + `.dark` in `packages/ui-components/src/styles.css` to the palette above; set `--radius: 0.125rem`. Add `--font-display` / `--font-serif` / `--font-mono` CSS vars, a `.paper-grain` utility (SVG `feTurbulence` data-URI), and keyframes for staggered load + drawn underline.
2. **Fonts** — Add `@fontsource-variable/fraunces`, `@fontsource/newsreader`, `@fontsource-variable/spline-sans-mono` as dependencies. Import in `apps/web/src/app.tsx` and `apps/extension/src/entrypoints/popup/main.tsx` (JS imports, no postcss-import dependency). Wire `fontFamily` (`display`/`serif`/`mono`) into **both** `apps/web/tailwind.config.js` and `packages/ui-components/tailwind.config.js` (extension inherits via preset). Extension uses npm — install separately.
3. **Shared components** (`packages/ui-components/src/`) — Restyle `button` (sharp radius, oxblood default + hairline outline, mono option), `card` (hairline border, no shadow), `input`, `select`, `badge` (letterpress tag), `confirm-dialog`, `theme-toggle` (SVG icons).
4. **New shared bits** — `CorvusMark` / `FeatherMark` SVG component; `PaperBackground` / grain layer; an editorial `Masthead` helper, reused across web pages (and extension where it fits).
5. **Web pages** — Remove every hardcoded `from-purple-*` / `bg-card/80` / `backdrop-blur` / `shadow-xl` and emoji from: `signin`, `signup`, `profile`, `GoogleAuthForm`, `WishlistDashboard`, and dialogs (`AddItemDialog`, `EditItemDialog`, `ViewItemDialog`, `CategoryManager`, `RecentItemsWidget`, `WishlistFilters`, `BulkActionBar`, `LinkManager`). Apply Section 3 layouts.
6. **Extension** — Tokens/components inherited; light pass on `WishlistView`, `AddToWishlist`, `ItemDetailsModal`, `CategoryManager` to remove hardcoded colors/emoji and confirm the `w-96` popup reads well.
7. **Tests & gates** — Update/fix `.test.tsx` suites that assert specific classes, emoji, or copy. After each area run web vitest, `cd apps/api && bun run test`, extension tests, `bun lint`, `bun check-types`. Logic must not change.

### Phasing

1. Tokens + fonts + shared components → verify both apps boot.
2. Web auth + profile.
3. Web dashboard + dialogs.
4. Extension pass.
5. Full test / lint / type sweep.

## 5. Out of Scope / Non-goals

- No changes to GraphQL schema, resolvers, auth flow, data model, or routing behavior (legacy `login`/`register` stay redirect-only).
- No new product features; this is a visual/presentational redesign only.
- No functional/logic changes to component behavior — only markup/styling and icon swaps.

## 6. Success Criteria

- No purple/pink gradient, `backdrop-blur`, `shadow-xl`, or emoji icon remains in the web app UI.
- All pages render in the warm-paper light theme with the oxblood accent and the three-font system; dark (espresso) theme works via the existing toggle.
- The Corvus constellation/feather identity appears on auth and empty states.
- Extension popup adopts the new theme and remains usable at `w-96`.
- `bun lint`, `bun check-types`, and all test suites pass.
