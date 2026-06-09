# UI Redesign — "Corvus, the Catalogue" Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current purple-gradient "AI-slop" UI with a warm-paper / archival-catalogue design (oxblood accent, three-font typesetting, hairline rules, Corvus constellation identity) across every web page, driven by shared design tokens that also re-theme the browser extension.

**Architecture:** Design tokens (HSL CSS variables) live in `packages/ui-components/src/styles.css` and flow to both apps via Tailwind. Shared components (`button`, `card`, `input`, `select`, `badge`, `theme-toggle`, `confirm-dialog`) are restyled once and inherited everywhere. New shared SVG marks (`CorvusMark`, `FeatherMark`, `PaperBackground`) supply the identity. Web pages then drop their hardcoded gradient/blur/shadow/emoji classes and adopt editorial layouts. Logic and data flow are untouched — this is presentational only.

**Tech Stack:** SolidJS, Tailwind CSS v3, class-variance-authority, `@fontsource-variable` self-hosted fonts, Vitest, Turborepo (Bun for web/packages, npm for extension).

**Spec:** `docs/superpowers/specs/2026-06-08-ui-redesign-archival-catalogue-design.md`

---

## Conventions for this plan

- **Token reference (used throughout):** background = paper, card = card-stock, foreground = ink, primary = oxblood, border = hairline. Always use semantic Tailwind classes (`bg-background`, `text-foreground`, `bg-primary`, `border-border`, `text-muted-foreground`) — **never** hardcoded `purple-*`/`pink-*`/`gray-900`/`shadow-xl`/`backdrop-blur`.
- **Fonts:** `font-display` (Fraunces) for big headers, `font-serif` (Newsreader) for titles/prose, `font-mono` (Spline Sans Mono) for metadata/labels.
- **No shadows/blur:** structure comes from `border` (1px hairline). Remove every `shadow-*`, `backdrop-blur-*`, `bg-card/80`, `bg-gradient-*`, `bg-clip-text text-transparent`.
- **Verification commands** (run from repo root unless noted):
  - UI components: `cd packages/ui-components && bun run test`
  - Web units: `cd apps/web && bun run test:unit`
  - Extension: `cd apps/extension && npm run test`
  - API (regression): `cd apps/api && bun run test`
  - Lint: `bun lint` · Types: `bun check-types`
- **Commits:** one per task (or per logical step where noted). Co-author line:
  `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`
- **Visual reality:** pure-visual steps can't be unit-tested. "Verify" for those means: the relevant test suite still passes, `bun check-types` + `bun lint` pass, and the dev server renders without console errors (`cd apps/web && bun run dev`, open the page).

---

## File Structure

**Modified (shared — re-themes both apps):**

- `packages/ui-components/src/styles.css` — tokens, font vars, paper-grain utility, keyframes
- `packages/ui-components/tailwind.config.js` — add `fontFamily` (extension inherits via preset)
- `packages/ui-components/src/{button,card,input,select,badge,theme-toggle,confirm-dialog}.tsx` — restyle
- `packages/ui-components/tests/theme-toggle.test.tsx` — update emoji→SVG assertions
- `apps/web/tailwind.config.js` — add `fontFamily`
- `apps/web/src/app.tsx` — import fonts
- `apps/extension/src/entrypoints/popup/main.tsx` — import fonts

**Created (shared identity):**

- `packages/ui-components/src/corvus-mark.tsx` — `CorvusMark`, `FeatherMark`
- `packages/ui-components/src/paper-background.tsx` — `PaperBackground`
- `packages/ui-components/tests/corvus-mark.test.tsx`

**Modified (web pages/components):**

- `apps/web/src/routes/{signin,signup,profile}.tsx`
- `apps/web/src/components/auth/GoogleAuthForm.tsx`
- `apps/web/src/components/WishlistDashboard.tsx`
- `apps/web/src/components/{WishlistFilters,RecentItemsWidget,BulkActionBar}.tsx`
- `apps/web/src/components/{AddItemDialog,EditItemDialog,ViewItemDialog,CategoryManager,LinkManager}.tsx`
- `apps/web/public/` favicon (optional)

**Modified (extension):**

- `apps/extension/src/entrypoints/popup/main.tsx`
- `apps/extension/src/components/{WishlistView,AddToWishlist,ItemDetailsModal,CategoryManager}.tsx`

---

## PHASE 1 — Foundation (tokens, fonts, shared components, identity)

### Task 1: Install fonts and wire `fontFamily`

**Files:**

- Modify: `packages/ui-components/package.json` (deps)
- Modify: `apps/extension/package.json` (deps)
- Modify: `packages/ui-components/tailwind.config.js`
- Modify: `apps/web/tailwind.config.js`
- Modify: `apps/web/src/app.tsx`
- Modify: `apps/extension/src/entrypoints/popup/main.tsx`

- [ ] **Step 1: Install font packages for web/packages (Bun workspace root)**

Run:

```bash
bun add -D @fontsource-variable/fraunces @fontsource-variable/newsreader @fontsource-variable/spline-sans-mono --cwd packages/ui-components
```

Expected: three packages added to `packages/ui-components/package.json` devDependencies. (Placed in ui-components so the web app, which depends on it via the workspace, resolves them.)

- [ ] **Step 2: Install the same fonts for the extension (npm)**

Run:

```bash
cd apps/extension && npm install @fontsource-variable/fraunces @fontsource-variable/newsreader @fontsource-variable/spline-sans-mono
```

Expected: three packages in `apps/extension/package.json` dependencies.

- [ ] **Step 3: Add `fontFamily` to the shared preset (extension inherits this)**

In `packages/ui-components/tailwind.config.js`, inside `theme.extend`, add a `fontFamily` block alongside `colors`:

```js
      fontFamily: {
        display: ['"Fraunces Variable"', 'Fraunces', 'Georgia', 'serif'],
        serif: ['"Newsreader Variable"', 'Newsreader', 'Georgia', 'serif'],
        mono: ['"Spline Sans Mono Variable"', '"Spline Sans Mono"', 'ui-monospace', 'monospace'],
        sans: ['"Newsreader Variable"', 'Newsreader', 'Georgia', 'serif'],
      },
```

(Note: `sans` is intentionally mapped to the body serif so default text reads as typeset prose.)

- [ ] **Step 4: Add the identical `fontFamily` to the web config**

The web app's `apps/web/tailwind.config.js` defines its theme directly (no preset). Add the same `fontFamily` block inside its `theme.extend`, after `borderRadius`:

```js
      fontFamily: {
        display: ['"Fraunces Variable"', 'Fraunces', 'Georgia', 'serif'],
        serif: ['"Newsreader Variable"', 'Newsreader', 'Georgia', 'serif'],
        mono: ['"Spline Sans Mono Variable"', '"Spline Sans Mono"', 'ui-monospace', 'monospace'],
        sans: ['"Newsreader Variable"', 'Newsreader', 'Georgia', 'serif'],
      },
```

- [ ] **Step 5: Import fonts in the web entry**

In `apps/web/src/app.tsx`, add these imports directly under `import "@repo/ui-components/styles";`:

```ts
import "@fontsource-variable/fraunces";
import "@fontsource-variable/newsreader";
import "@fontsource-variable/spline-sans-mono";
```

- [ ] **Step 6: Import fonts in the extension popup entry**

In `apps/extension/src/entrypoints/popup/main.tsx`, add directly under `import "@repo/ui-components/styles";`:

```ts
import "@fontsource-variable/fraunces";
import "@fontsource-variable/newsreader";
import "@fontsource-variable/spline-sans-mono";
```

- [ ] **Step 7: Verify both apps still type-check**

Run: `bun check-types`
Expected: PASS (no new errors).

- [ ] **Step 8: Commit**

```bash
git add packages/ui-components/package.json apps/extension/package.json packages/ui-components/tailwind.config.js apps/web/tailwind.config.js apps/web/src/app.tsx apps/extension/src/entrypoints/popup/main.tsx bun.lock apps/extension/package-lock.json
git commit -m "feat(ui): add archival font stack (Fraunces/Newsreader/Spline Mono)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 2: Rewrite design tokens, paper grain, and motion keyframes

**Files:**

- Modify: `packages/ui-components/src/styles.css`

- [ ] **Step 1: Replace the entire contents of `packages/ui-components/src/styles.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    /* Warm paper / archival — LIGHT (primary) */
    --background: 40 33% 94%;
    --foreground: 30 10% 12%;
    --card: 42 44% 97%;
    --card-foreground: 30 10% 12%;
    --popover: 42 44% 97%;
    --popover-foreground: 30 10% 12%;
    --primary: 14 60% 32%; /* oxblood */
    --primary-foreground: 42 44% 97%;
    --secondary: 38 22% 88%;
    --secondary-foreground: 30 10% 18%;
    --muted: 38 22% 90%;
    --muted-foreground: 33 10% 40%;
    --accent: 38 26% 86%;
    --accent-foreground: 30 10% 14%;
    --destructive: 4 56% 38%;
    --destructive-foreground: 42 44% 97%;
    --border: 36 18% 82%;
    --input: 36 18% 78%;
    --ring: 14 60% 32%;
    --radius: 0.125rem;

    --font-display: "Fraunces Variable", Fraunces, Georgia, serif;
    --font-serif: "Newsreader Variable", Newsreader, Georgia, serif;
    --font-mono:
      "Spline Sans Mono Variable", "Spline Sans Mono", ui-monospace, monospace;
  }

  .dark {
    /* Espresso — DARK (secondary) */
    --background: 30 12% 8%;
    --foreground: 40 30% 90%;
    --card: 30 10% 11%;
    --card-foreground: 40 30% 90%;
    --popover: 30 10% 11%;
    --popover-foreground: 40 30% 90%;
    --primary: 14 65% 52%; /* brightened oxblood */
    --primary-foreground: 30 12% 8%;
    --secondary: 30 8% 18%;
    --secondary-foreground: 40 30% 90%;
    --muted: 30 8% 16%;
    --muted-foreground: 36 12% 60%;
    --accent: 30 8% 20%;
    --accent-foreground: 40 30% 92%;
    --destructive: 4 60% 50%;
    --destructive-foreground: 40 30% 92%;
    --border: 30 8% 22%;
    --input: 30 8% 26%;
    --ring: 14 65% 52%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
    font-family: var(--font-serif);
  }
}

@layer utilities {
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  /* Faint paper grain overlay — apply to a fixed/absolute full-bleed layer */
  .paper-grain {
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E");
    opacity: 0.04;
  }

  /* Drawn-underline used on text links/rows */
  .rule-underline {
    background-image: linear-gradient(currentColor, currentColor);
    background-position: 0 100%;
    background-size: 0% 1px;
    background-repeat: no-repeat;
    transition: background-size 0.3s ease;
  }
  .rule-underline:hover,
  .rule-underline:focus-visible {
    background-size: 100% 1px;
  }
}

@layer utilities {
  @keyframes rise-in {
    from {
      opacity: 0;
      transform: translateY(8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  .animate-rise {
    animation: rise-in 0.5s cubic-bezier(0.16, 1, 0.3, 1) both;
  }

  @keyframes rule-draw {
    from {
      transform: scaleX(0);
    }
    to {
      transform: scaleX(1);
    }
  }
  .animate-rule {
    transform-origin: left;
    animation: rule-draw 0.6s cubic-bezier(0.16, 1, 0.3, 1) both;
  }
}
```

- [ ] **Step 2: Verify UI-components tests still pass (tokens don't break logic)**

Run: `cd packages/ui-components && bun run test`
Expected: PASS (theme-toggle still uses emoji at this point — that's fine, updated in Task 7).

- [ ] **Step 3: Visually boot-check the web app**

Run: `cd apps/web && bun run dev` then open `http://localhost:5000/signin`.
Expected: page background is warm paper (not purple), text renders in serif. (Hardcoded gradients on the page still exist — they'll be removed in Phase 2. Goal here is only: tokens applied, no build error.)
Stop the dev server.

- [ ] **Step 4: Commit**

```bash
git add packages/ui-components/src/styles.css
git commit -m "feat(ui): rewrite design tokens to warm-paper archival palette

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 3: Restyle the shared `Button`

**Files:**

- Modify: `packages/ui-components/src/button.tsx`

- [ ] **Step 1: Replace the `buttonVariants` cva call in `packages/ui-components/src/button.tsx`**

Keep the imports, `ButtonProps`, and `Button` function unchanged. Replace only the `const buttonVariants = cva(...)` block with:

```ts
const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-sm text-sm font-medium font-mono uppercase tracking-wide ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-transparent hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "font-serif normal-case tracking-normal text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-sm px-3 text-xs",
        lg: "h-11 rounded-sm px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);
```

(Rationale: mono uppercase labels = "ledger" feel; `rounded-sm` resolves to ~`calc(0.125rem - 4px)` → effectively square; `link` variant opts back into prose serif.)

- [ ] **Step 2: Verify**

Run: `cd packages/ui-components && bun run test` then `bun check-types`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add packages/ui-components/src/button.tsx
git commit -m "feat(ui): restyle Button for archival ledger aesthetic

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 4: Restyle the shared `Card`

**Files:**

- Modify: `packages/ui-components/src/card.tsx`

- [ ] **Step 1: Update the base classes in two functions of `packages/ui-components/src/card.tsx`**

In `Card`, replace:

```ts
        "rounded-lg border bg-card text-card-foreground shadow-sm",
```

with:

```ts
        "rounded-sm border border-border bg-card text-card-foreground",
```

In `CardTitle`, replace:

```ts
        "text-2xl font-semibold leading-none tracking-tight",
```

with:

```ts
        "font-display text-2xl font-semibold leading-tight tracking-tight",
```

In `CardDescription`, replace:

```ts
    <p class={cn("text-sm text-muted-foreground", local.class)} {...others} />
```

with:

```ts
    <p
      class={cn(
        "font-mono text-xs uppercase tracking-wide text-muted-foreground",
        local.class,
      )}
      {...others}
    />
```

(Leave `CardHeader`, `CardContent`, `CardFooter` as-is.)

- [ ] **Step 2: Verify**

Run: `cd packages/ui-components && bun run test` then `bun check-types`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add packages/ui-components/src/card.tsx
git commit -m "feat(ui): restyle Card to hairline paper panel

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 5: Restyle shared `Input` and `Select`

**Files:**

- Modify: `packages/ui-components/src/input.tsx`
- Modify: `packages/ui-components/src/select.tsx`

- [ ] **Step 1: Update `Input` base classes**

In `packages/ui-components/src/input.tsx`, replace the class string with:

```ts
        "flex h-10 w-full rounded-sm border border-input bg-background px-3 py-2 font-serif text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
```

- [ ] **Step 2: Update `Select` base classes**

In `packages/ui-components/src/select.tsx`, replace the class string with:

```ts
        "flex h-10 w-full rounded-sm border border-input bg-background px-3 py-2 font-serif text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
```

- [ ] **Step 3: Verify**

Run: `cd packages/ui-components && bun run test` then `bun check-types`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add packages/ui-components/src/input.tsx packages/ui-components/src/select.tsx
git commit -m "feat(ui): restyle Input and Select for paper theme

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 6: Restyle shared `Badge` (letterpress tag)

**Files:**

- Modify: `packages/ui-components/src/badge.tsx`

- [ ] **Step 1: Replace the `badgeVariants` cva base + variants**

In `packages/ui-components/src/badge.tsx`, replace the `cva(...)` first argument and `variants.variant` block:

```ts
const badgeVariants = cva(
  "inline-flex items-center rounded-sm border px-2 py-0.5 font-mono text-[10px] font-medium uppercase tracking-wider transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-primary/30 bg-primary/10 text-primary",
        secondary: "border-border bg-secondary text-secondary-foreground",
        destructive: "border-destructive/30 bg-destructive/10 text-destructive",
        outline: "border-border text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);
```

- [ ] **Step 2: Verify**

Run: `cd packages/ui-components && bun run test` then `bun check-types`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add packages/ui-components/src/badge.tsx
git commit -m "feat(ui): restyle Badge as letterpress tag

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 7: Convert `ThemeToggle` to SVG icons (test-first)

**Files:**

- Modify: `packages/ui-components/tests/theme-toggle.test.tsx:25,36`
- Modify: `packages/ui-components/src/theme-toggle.tsx`

- [ ] **Step 1: Read the current test to know what to change**

Run: `cat packages/ui-components/tests/theme-toggle.test.tsx`
Note the two assertions: `screen.getByText("☀️")` (light) and `screen.getByText("🌙")` (dark).

- [ ] **Step 2: Update the test to assert on accessible labels instead of emoji**

In `packages/ui-components/tests/theme-toggle.test.tsx`, replace:

```ts
expect(screen.getByText("☀️")).toBeInTheDocument();
```

with:

```ts
expect(screen.getByLabelText("Light theme active")).toBeInTheDocument();
```

and replace:

```ts
expect(screen.getByText("🌙")).toBeInTheDocument();
```

with:

```ts
expect(screen.getByLabelText("Dark theme active")).toBeInTheDocument();
```

- [ ] **Step 3: Run the test to verify it FAILS**

Run: `cd packages/ui-components && bun run test theme-toggle`
Expected: FAIL (no element with those labels yet).

- [ ] **Step 4: Replace `theme-toggle.tsx` with an SVG implementation**

```tsx
import { Button } from "./button";

interface ThemeToggleProps {
  theme: () => "light" | "dark" | "system";
  setTheme: (theme: "light" | "dark" | "system") => void;
  resolvedTheme: () => "light" | "dark";
}

export function ThemeToggle(props: ThemeToggleProps) {
  const cycleTheme = () => {
    const resolved = props.resolvedTheme();
    props.setTheme(resolved === "light" ? "dark" : "light");
  };

  const isDark = () => props.resolvedTheme() === "dark";

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={cycleTheme}
      title={`Current theme: ${isDark() ? "Dark" : "Light"}. Click to cycle.`}
      aria-label={isDark() ? "Dark theme active" : "Light theme active"}
    >
      {isDark() ? (
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      ) : (
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
        </svg>
      )}
    </Button>
  );
}
```

- [ ] **Step 5: Run the test to verify it PASSES**

Run: `cd packages/ui-components && bun run test theme-toggle`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/ui-components/src/theme-toggle.tsx packages/ui-components/tests/theme-toggle.test.tsx
git commit -m "feat(ui): replace ThemeToggle emoji with SVG icons

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 8: Restyle `confirm-dialog`

**Files:**

- Read then Modify: `packages/ui-components/src/confirm-dialog.tsx`

- [ ] **Step 1: Read the file**

Run: `cat packages/ui-components/src/confirm-dialog.tsx`
Identify: the backdrop element, the panel element, and any hardcoded colors (`bg-white`, `bg-black/50`, `shadow-*`, rounded corners, emoji).

- [ ] **Step 2: Apply paper-panel styling**

Edit so that:

- The backdrop uses `bg-foreground/40` (darkened paper) instead of `bg-black/50`, and drop any `backdrop-blur`.
- The panel uses `rounded-sm border border-border bg-card text-card-foreground` and **no** `shadow-*`.
- Any title uses `font-display`; any body uses `font-serif`; any small label uses `font-mono`.
- Replace any emoji with text or an inline SVG.
- Keep all props, callbacks, and ARIA roles exactly as they are.

(Concrete classes depend on the current markup read in Step 1; apply the token/font rules above to each element.)

- [ ] **Step 3: Verify**

Run: `cd packages/ui-components && bun run test` then `bun check-types`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add packages/ui-components/src/confirm-dialog.tsx
git commit -m "feat(ui): restyle confirm-dialog to paper panel

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 9: New shared identity components (`CorvusMark`, `FeatherMark`, `PaperBackground`)

**Files:**

- Create: `packages/ui-components/src/corvus-mark.tsx`
- Create: `packages/ui-components/src/paper-background.tsx`
- Create: `packages/ui-components/tests/corvus-mark.test.tsx`
- Modify: `packages/ui-components/package.json` (exports)

- [ ] **Step 1: Write a failing render test**

Create `packages/ui-components/tests/corvus-mark.test.tsx`:

```tsx
import { render, screen } from "@solidjs/testing-library";
import { describe, it, expect } from "vitest";
import { CorvusMark, FeatherMark } from "../src/corvus-mark";

describe("CorvusMark", () => {
  it("renders an accessible constellation mark", () => {
    render(() => <CorvusMark title="Corvus" />);
    expect(screen.getByRole("img", { name: "Corvus" })).toBeInTheDocument();
  });
});

describe("FeatherMark", () => {
  it("renders a decorative feather (aria-hidden)", () => {
    const { container } = render(() => <FeatherMark />);
    const svg = container.querySelector("svg");
    expect(svg).not.toBeNull();
    expect(svg?.getAttribute("aria-hidden")).toBe("true");
  });
});
```

- [ ] **Step 2: Run the test to verify it FAILS**

Run: `cd packages/ui-components && bun run test corvus-mark`
Expected: FAIL (module not found).

- [ ] **Step 3: Create `corvus-mark.tsx`**

```tsx
import { splitProps, type ComponentProps } from "solid-js";
import { cn } from "./utils";

interface CorvusMarkProps extends ComponentProps<"svg"> {
  /** Accessible name. If omitted, the mark is treated as decorative. */
  title?: string;
}

/**
 * The Corvus constellation (the Crow): four principal stars
 * (Gienah, Algorab, Kraz, Minkar) connected as a quadrilateral.
 */
export function CorvusMark(props: CorvusMarkProps) {
  const [local, others] = splitProps(props, ["title", "class"]);
  const decorative = () => local.title == null;

  return (
    <svg
      viewBox="0 0 64 56"
      fill="none"
      stroke="currentColor"
      stroke-width="1.25"
      stroke-linecap="round"
      stroke-linejoin="round"
      role={decorative() ? undefined : "img"}
      aria-hidden={decorative() ? "true" : undefined}
      aria-label={local.title}
      class={cn("text-primary", local.class)}
      {...others}
    >
      {local.title ? <title>{local.title}</title> : null}
      {/* edges of the quadrilateral */}
      <path d="M10 14 L46 8 L54 34 L20 46 Z" opacity="0.5" />
      {/* stars */}
      <circle cx="10" cy="14" r="2.4" fill="currentColor" stroke="none" />
      <circle cx="46" cy="8" r="3" fill="currentColor" stroke="none" />
      <circle cx="54" cy="34" r="2.2" fill="currentColor" stroke="none" />
      <circle cx="20" cy="46" r="2.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

/** A fine decorative feather rule, used in empty states and footers. */
export function FeatherMark(props: ComponentProps<"svg">) {
  const [local, others] = splitProps(props, ["class"]);
  return (
    <svg
      viewBox="0 0 24 48"
      fill="none"
      stroke="currentColor"
      stroke-width="1.25"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
      class={cn("text-muted-foreground", local.class)}
      {...others}
    >
      <path d="M12 2 C18 10 18 28 12 46" />
      <path
        d="M12 8 L6 12 M12 14 L5 19 M12 20 L5 26 M12 26 L6 32 M12 32 L8 37"
        opacity="0.7"
      />
      <path
        d="M12 8 L18 12 M12 14 L19 19 M12 20 L19 26 M12 26 L18 32 M12 32 L16 37"
        opacity="0.7"
      />
    </svg>
  );
}
```

- [ ] **Step 4: Create `paper-background.tsx`**

```tsx
import { splitProps, type ComponentProps } from "solid-js";
import { cn } from "./utils";

/**
 * Full-bleed warm-paper backdrop with a faint grain overlay.
 * Render once near the root of a page; place page content in a higher
 * stacking context (e.g. a `relative` wrapper).
 */
export function PaperBackground(props: ComponentProps<"div">) {
  const [local, others] = splitProps(props, ["class"]);
  return (
    <div
      aria-hidden="true"
      class={cn(
        "pointer-events-none fixed inset-0 -z-10 bg-background",
        local.class,
      )}
      {...others}
    >
      <div class="paper-grain absolute inset-0" />
    </div>
  );
}
```

- [ ] **Step 5: Add exports to `packages/ui-components/package.json`**

In the `"exports"` map, add (after the `"./theme-toggle"` line):

```json
    "./corvus-mark": "./src/corvus-mark.tsx",
    "./paper-background": "./src/paper-background.tsx",
```

- [ ] **Step 6: Run the test to verify it PASSES**

Run: `cd packages/ui-components && bun run test corvus-mark` then `bun check-types`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add packages/ui-components/src/corvus-mark.tsx packages/ui-components/src/paper-background.tsx packages/ui-components/tests/corvus-mark.test.tsx packages/ui-components/package.json
git commit -m "feat(ui): add Corvus constellation, feather, and paper-background marks

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 10: Foundation gate — verify both apps build with the new system

**Files:** none (verification only)

- [ ] **Step 1: Type-check everything**

Run: `bun check-types`
Expected: PASS.

- [ ] **Step 2: Lint everything**

Run: `bun lint`
Expected: PASS (≤25 warnings).

- [ ] **Step 3: Run all unit suites**

Run:

```bash
cd packages/ui-components && bun run test
cd ../../apps/web && bun run test:unit
cd ../extension && npm run test
cd ../api && bun run test
```

Expected: all PASS. (Web pages still carry hardcoded gradients — fixed in Phase 2/3 — but tests should pass since logic is unchanged.)

- [ ] **Step 4: No commit (gate only). If anything fails, fix before proceeding.**

---

## PHASE 2 — Web auth + profile

### Task 11: Editorial auth pages (`signin`, `signup`, `GoogleAuthForm`)

**Files:**

- Modify: `apps/web/src/components/auth/GoogleAuthForm.tsx`
- Modify: `apps/web/src/routes/signin.tsx`
- Modify: `apps/web/src/routes/signup.tsx`
- Read: `apps/web/src/routes/signup.tsx` (confirm structure mirrors signin)

- [ ] **Step 1: Read `signup.tsx` to confirm it mirrors `signin.tsx`**

Run: `cat apps/web/src/routes/signup.tsx`
Expected: same shape as signin but `mode="signup"`. Apply identical changes to both routes in Step 3.

- [ ] **Step 2: Rewrite `GoogleAuthForm.tsx` body**

Replace the `return (...)` of `GoogleAuthForm` with:

```tsx
return (
  <Card class="w-full border border-border bg-card">
    <CardHeader class="pb-4 text-center">
      <CardTitle class="font-display text-2xl text-card-foreground">
        {TITLES[props.mode]}
      </CardTitle>
    </CardHeader>
    <CardContent class="px-8 pb-8">
      {errorMessage() && (
        <div
          role="alert"
          class="mb-4 rounded-sm border border-destructive/40 bg-destructive/10 px-4 py-3 font-serif text-sm text-destructive"
        >
          {errorMessage()}
        </div>
      )}
      <a
        href={getGoogleAuthStartUrl()}
        target="_self"
        class="flex w-full items-center justify-center gap-2 rounded-sm border border-primary bg-primary px-4 py-3 font-mono text-xs font-medium uppercase tracking-wide text-primary-foreground transition-colors duration-200 hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
      >
        {BUTTON_LABELS[props.mode]}
      </a>
    </CardContent>
  </Card>
);
```

(Removed: `shadow-xl border-0 bg-card/80 backdrop-blur-sm`, the white Google button. Keep the imports, `ERROR_MESSAGES`, `TITLES`, `BUTTON_LABELS`, `errorMessage()` exactly.)

- [ ] **Step 3: Rewrite the `signin.tsx` markup**

Replace the `return (...)` of `SignIn` with (add `CorvusMark` + `PaperBackground` imports at top):

```tsx
import { Title } from "@solidjs/meta";
import { useSearchParams } from "@solidjs/router";
import { GoogleAuthForm } from "../components/auth/GoogleAuthForm";
import { ThemeProvider } from "../lib/theme/context";
import { CorvusMark } from "@repo/ui-components/corvus-mark";
import { PaperBackground } from "@repo/ui-components/paper-background";

export default function SignIn() {
  const [searchParams] = useSearchParams();
  const error = Array.isArray(searchParams.error)
    ? searchParams.error[0]
    : searchParams.error;

  return (
    <ThemeProvider>
      <Title>Sign In - Corvus</Title>
      <PaperBackground />
      <div class="relative flex min-h-screen items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
        <div class="w-full max-w-sm">
          <div class="mb-8 flex flex-col items-center text-center">
            <CorvusMark title="Corvus" class="mb-4 h-12 w-12 animate-rise" />
            <h1 class="font-display text-4xl font-semibold tracking-tight text-foreground animate-rise">
              Corvus
            </h1>
            <p class="mt-2 font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
              A catalogue of desire
            </p>
          </div>
          <GoogleAuthForm mode="signin" error={error} />
        </div>
      </div>
    </ThemeProvider>
  );
}
```

- [ ] **Step 4: Apply the same change to `signup.tsx`**

Use the identical structure as Step 3 but: `Title` = `"Sign Up - Corvus"`, `GoogleAuthForm mode="signup"`, and keep `signup`'s existing search-param handling (mirror whatever Step 1 showed — if signup reads `error` the same way, replicate exactly).

- [ ] **Step 5: Verify auth tests pass**

Run: `cd apps/web && bun run test:unit signin && bun run test:unit signup && bun run test:unit GoogleAuthForm`
Expected: PASS. (If a test asserts the old gradient `h1` classes or `bg-white` button, update the assertion to the new copy/role — keep assertions on visible text/roles, not styling.)

- [ ] **Step 6: Visual check**

Run: `cd apps/web && bun run dev`, open `/signin` and `/signup`.
Expected: paper background, constellation mark, Fraunces "Corvus", oxblood Google button, no purple.

- [ ] **Step 7: Commit**

```bash
git add apps/web/src/routes/signin.tsx apps/web/src/routes/signup.tsx apps/web/src/components/auth/GoogleAuthForm.tsx
git commit -m "feat(web): editorial paper redesign for auth pages

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 12: Editorial `profile` page (specimen record)

**Files:**

- Modify: `apps/web/src/routes/profile.tsx`

- [ ] **Step 1: Replace the access-denied fallback block**

In `profile.tsx`, replace the `fallback={...}` JSX (the "Access Denied" card) with:

```tsx
        fallback={
          <>
            <PaperBackground />
            <div class="relative flex min-h-screen items-center justify-center px-4">
              <Card class="max-w-md border border-border bg-card">
                <CardContent class="p-8 text-center">
                  <h1 class="font-display text-2xl font-semibold text-foreground">
                    Access Denied
                  </h1>
                  <p class="mb-6 mt-3 font-serif text-muted-foreground">
                    Please sign in to view your profile.
                  </p>
                  <div class="flex justify-center gap-3">
                    <A href="/signin">
                      <Button>Sign In</Button>
                    </A>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        }
```

- [ ] **Step 2: Replace the authenticated `<main>` block**

Replace the `<main class="min-h-screen bg-gradient-to-br ...">...</main>` with:

```tsx
<>
  <PaperBackground />
  <main class="relative min-h-screen">
    <div class="container mx-auto px-4 py-12">
      <div class="mb-10">
        <p class="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
          Specimen Record
        </p>
        <h1 class="font-display text-4xl font-semibold tracking-tight text-foreground">
          Your Profile
        </h1>
        <div class="mt-4 h-px w-full origin-left bg-border animate-rule" />
      </div>

      <Card class="mx-auto max-w-2xl border border-border bg-card">
        <CardContent class="px-8 py-8">
          <dl class="divide-y divide-border">
            <div class="grid grid-cols-1 gap-2 py-4 sm:grid-cols-3 sm:items-baseline">
              <dt class="font-mono text-xs uppercase tracking-wide text-muted-foreground">
                Name
              </dt>
              <dd class="font-serif text-lg text-foreground sm:col-span-2">
                {auth.user()!.name}
              </dd>
            </div>
            <div class="grid grid-cols-1 gap-2 py-4 sm:grid-cols-3 sm:items-baseline">
              <dt class="font-mono text-xs uppercase tracking-wide text-muted-foreground">
                Email
              </dt>
              <dd class="font-serif text-foreground sm:col-span-2">
                {auth.user()!.email}
              </dd>
            </div>
            <div class="grid grid-cols-1 gap-2 py-4 sm:grid-cols-3 sm:items-baseline">
              <dt class="font-mono text-xs uppercase tracking-wide text-muted-foreground">
                Member Since
              </dt>
              <dd class="font-mono text-sm text-foreground sm:col-span-2">
                {formatDate(auth.user()!.createdAt)}
              </dd>
            </div>
            <div class="grid grid-cols-1 gap-2 py-4 sm:grid-cols-3 sm:items-baseline">
              <dt class="font-mono text-xs uppercase tracking-wide text-muted-foreground">
                Last Updated
              </dt>
              <dd class="font-mono text-sm text-foreground sm:col-span-2">
                {formatDate(auth.user()!.updatedAt)}
              </dd>
            </div>
          </dl>

          <div class="mt-8 flex flex-col items-center gap-4 border-t border-border pt-6 sm:flex-row">
            <A href="/dashboard">
              <Button variant="outline">Back to Dashboard</Button>
            </A>
            <Button
              variant="destructive"
              onClick={handleLogout}
              disabled={logoutMutation.isPending}
            >
              {logoutMutation.isPending ? "Signing Out…" : "Sign Out"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  </main>
</>
```

- [ ] **Step 3: Add the `PaperBackground` import + drop now-unused `CardHeader/CardTitle/CardDescription` if no longer referenced**

At the top of `profile.tsx` add:

```ts
import { PaperBackground } from "@repo/ui-components/paper-background";
```

Then remove any of `CardDescription`, `CardHeader`, `CardTitle` from the card import that the new markup no longer uses (keep `Card`, `CardContent`). `bun lint` will flag unused imports.

- [ ] **Step 4: Verify**

Run: `cd apps/web && bun run test:unit profile` then `bun check-types` then `bun lint`
Expected: PASS. (Update any test asserting old gradient classes/copy to assert visible text/roles.)

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/routes/profile.tsx
git commit -m "feat(web): redesign profile as archival specimen record

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## PHASE 3 — Web dashboard + dialogs

> These files are large. For each task: keep all signals, effects, handlers, props, and data flow **exactly** as they are. Change only markup/classes/icons. After each task run the matching `*.test.tsx` suite and fix assertions that target removed styling (re-point them at visible text/roles).

### Task 13: Dashboard masthead + page shell

**Files:**

- Modify: `apps/web/src/components/WishlistDashboard.tsx` (the outer `return` of `WishlistDashboard`, ~line 688–726 header, and root wrapper line 689)

- [ ] **Step 1: Add imports**

At the top of `WishlistDashboard.tsx`, add:

```ts
import { PaperBackground } from "@repo/ui-components/paper-background";
```

- [ ] **Step 2: Replace the root wrapper opening tag**

Replace:

```tsx
    <div class="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900">
```

with:

```tsx
    <div class="relative min-h-screen">
      <PaperBackground />
```

(Add the matching extra `</div>`? No — keep the existing closing `</div>` of the root; `PaperBackground` is self-closing, so the element count is unchanged. Just insert the `<PaperBackground />` line right after the opening `<div>`.)

- [ ] **Step 3: Replace the `<header>` block**

Replace the entire `<header class="bg-card/80 ...">...</header>` with:

```tsx
<header class="relative border-b border-border">
  <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
    <div class="flex items-center justify-between py-8">
      <div>
        <h1 class="font-display text-3xl font-semibold tracking-tight text-foreground">
          Corvus Wishlist
        </h1>
        <p class="mt-1 font-mono text-xs uppercase tracking-wide text-muted-foreground">
          Welcome back, {props.user.name}
        </p>
      </div>
      <div class="flex items-center gap-3">
        <ThemeToggle
          theme={theme.theme}
          setTheme={theme.setTheme}
          resolvedTheme={theme.resolvedTheme}
        />
        <A href="/profile">
          <Button variant="link">Profile</Button>
        </A>
        <Button variant="outline" onClick={handleLogout}>
          Sign Out
        </Button>
      </div>
    </div>
  </div>
</header>
```

- [ ] **Step 4: Verify**

Run: `cd apps/web && bun run test:unit WishlistDashboard` then `bun check-types`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/WishlistDashboard.tsx
git commit -m "feat(web): archival masthead for dashboard

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 14: Catalogue-entry item rows (`SortableWishlistItem`) + SVG icons

**Files:**

- Modify: `apps/web/src/components/WishlistDashboard.tsx` (the `SortableWishlistItem` function, ~line 63–188)

- [ ] **Step 1: Replace the `return (...)` of `SortableWishlistItem`**

Replace from `return (` to its matching close with:

```tsx
return (
  <div
    class={`group relative border-b border-border py-5 transition-colors ${
      props.isSelected ? "bg-primary/5" : "hover:bg-accent/40"
    }`}
  >
    <div class="flex items-start justify-between gap-4">
      <button
        type="button"
        onClick={handleClick}
        class="flex-1 rounded-sm border-0 bg-transparent p-0 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <div class="flex items-start gap-3">
          <Show when={props.isSelectionMode}>
            <input
              type="checkbox"
              checked={props.isSelected}
              onChange={handleCheckboxChange}
              onClick={(e) => e.stopPropagation()}
              aria-label={`Select ${props.item.title}`}
              class="mt-1.5 h-4 w-4 flex-shrink-0 cursor-pointer rounded-none border border-input accent-[hsl(var(--primary))]"
            />
          </Show>

          <div class="flex flex-1 flex-col gap-1.5">
            <div class="flex flex-wrap items-center gap-2">
              <h3 class="font-serif text-lg font-medium text-foreground transition-colors group-hover:text-primary">
                {props.item.title}
              </h3>
              <Show when={props.item.status && props.item.status !== "want"}>
                <span
                  class={`rounded-sm border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider ${
                    props.item.status === "purchased"
                      ? "border-primary/30 bg-primary/10 text-primary"
                      : "border-border bg-secondary text-muted-foreground"
                  }`}
                >
                  {props.item.status}
                </span>
              </Show>
              <Show when={props.item.priority != null}>
                <span class="rounded-sm border border-border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  P{props.item.priority}
                </span>
              </Show>
            </div>

            <Show when={props.item.description}>
              <p class="font-serif text-sm leading-relaxed text-muted-foreground">
                {props.item.description}
              </p>
            </Show>

            <div class="pt-1 font-mono text-xs text-muted-foreground">
              Added {createdAtLabel()} · {itemLinksCount()} link
              {itemLinksCount() !== 1 ? "s" : ""}
            </div>
          </div>
        </div>
      </button>

      <Show when={!props.isSelectionMode}>
        <div class="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
          <button
            onClick={() => props.onEdit(props.item)}
            class="rounded-sm p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-primary"
            title="Edit item"
            aria-label={`Edit ${props.item.title}`}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
            </svg>
          </button>
          <button
            onClick={() => props.onDelete(props.item.id)}
            class="rounded-sm p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
            title="Delete item"
            aria-label={`Delete ${props.item.title}`}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <path d="M3 6h18" />
              <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
              <path d="M10 11v6M14 11v6" />
            </svg>
          </button>
        </div>
      </Show>
    </div>
  </div>
);
```

(Removed: the `Card`/`CardContent` wrapper, `shadow-md`, `bg-card/80 backdrop-blur-sm`, emoji ✏️/×, the colored pill backgrounds. The `style` const and helper fns above the return stay.)

- [ ] **Step 2: Remove now-unused `style` var if it triggers a lint warning**

If `const style = {} as const;` and `<div style={style}>` were removed, delete the `style` declaration. (The new markup drops the outer `<div style={style}>`.) Run `bun lint` to confirm.

- [ ] **Step 3: Update the items list container to remove `space-y-4` card gaps**

In `WishlistItemsSection`, the `<div class="space-y-4">` wrapping the `For` becomes a ruled list. Replace:

```tsx
          <div class="space-y-4">
            <For each={props.filteredItems()}>
```

with:

```tsx
          <div class="border-t border-border">
            <For each={props.filteredItems()}>
```

- [ ] **Step 4: Verify**

Run: `cd apps/web && bun run test:unit WishlistDashboard` then `bun check-types` then `bun lint`
Expected: PASS. (Tests asserting emoji `✏️`/`×` must be re-pointed to the new `aria-label`s `Edit {title}` / `Delete {title}`.)

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/WishlistDashboard.tsx
git commit -m "feat(web): catalogue-entry item rows with SVG icons

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 15: Sidebar table-of-contents, ledger pagination, editorial empty/loading

**Files:**

- Modify: `apps/web/src/components/WishlistDashboard.tsx` (sidebar `Card` ~line 740–799; loading/empty `Card`s in `WishlistItemsSection` ~216–245; pagination footer ~262–295)

- [ ] **Step 1: Replace the sidebar `Card` block**

Replace the sidebar `<Card class="shadow-xl border-0 bg-card/80 backdrop-blur-sm">...</Card>` with:

```tsx
<Card class="border border-border bg-card">
  <CardHeader class="pb-4">
    <div class="flex items-center justify-between">
      <div>
        <CardTitle class="font-display text-xl text-card-foreground">
          Categories
        </CardTitle>
        <CardDescription>Organize your wishlist</CardDescription>
      </div>
      <button
        onClick={() => setCategoryManagerOpen(true)}
        title="Manage Categories"
        aria-label="Manage categories"
        class="rounded-sm p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-primary"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
        </svg>
      </button>
    </div>
  </CardHeader>
  <CardContent class="px-6 pb-6">
    <div class="space-y-0.5">
      <button
        onClick={() => setSelectedCategory(null)}
        class={`flex w-full items-baseline gap-2 border-l-2 px-3 py-2 text-left font-serif text-sm transition-colors ${
          selectedCategory() === null
            ? "border-primary bg-primary/5 text-primary"
            : "border-transparent text-foreground hover:bg-accent/40"
        }`}
      >
        <span class="flex-1">All Items</span>
        <span class="font-mono text-xs text-muted-foreground">
          {totalItems()}
        </span>
      </button>
      <For each={categories()}>
        {(category: WishlistCategory) => (
          <button
            onClick={() => setSelectedCategory(category.id)}
            class={`flex w-full items-center gap-2 border-l-2 px-3 py-2 text-left font-serif text-sm transition-colors ${
              selectedCategory() === category.id
                ? "border-primary bg-primary/5 text-primary"
                : "border-transparent text-foreground hover:bg-accent/40"
            }`}
          >
            <span
              class="h-2 w-2 flex-shrink-0 rounded-full"
              style={{
                "background-color": category.color || "hsl(var(--primary))",
              }}
            />
            <span class="flex-1">{category.name}</span>
          </button>
        )}
      </For>
    </div>
  </CardContent>
</Card>
```

- [ ] **Step 2: Replace the loading `Card` in `WishlistItemsSection`**

Replace:

```tsx
<Card class="shadow-xl border-0 bg-card/80 backdrop-blur-sm">
  <CardContent class="text-center py-16">
    <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
    <div class="text-muted-foreground">Loading your wishlist...</div>
  </CardContent>
</Card>
```

with:

```tsx
<div class="border-t border-border py-16 text-center">
  <div class="mx-auto mb-4 h-px w-24 origin-left bg-primary animate-rule" />
  <div class="font-mono text-xs uppercase tracking-wide text-muted-foreground">
    Compiling your catalogue…
  </div>
</div>
```

- [ ] **Step 3: Replace the empty-state `Card`**

Replace:

```tsx
<Card class="shadow-xl border-0 bg-card/80 backdrop-blur-sm">
  <CardContent class="text-center py-16">
    <div class="text-muted-foreground text-lg">
      {props.searchQuery()
        ? `No items found matching "${props.searchQuery()}"`
        : "No items in this category yet. Add your first item!"}
    </div>
  </CardContent>
</Card>
```

with:

```tsx
<div class="flex flex-col items-center border-t border-border py-16 text-center">
  <FeatherMark class="mb-4 h-12 w-6" />
  <div class="font-serif text-lg text-muted-foreground">
    {props.searchQuery()
      ? `Nothing catalogued under "${props.searchQuery()}".`
      : "The catalogue is empty. Add your first entry."}
  </div>
</div>
```

Add `import { FeatherMark } from "@repo/ui-components/corvus-mark";` at the top of the file.

- [ ] **Step 4: Replace the pagination footer**

Replace the `<div class="flex flex-col sm:flex-row ... pt-2">...</div>` footer with:

```tsx
<div class="flex flex-col gap-3 border-t border-border pt-4 font-mono text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
  <div>
    <Show
      when={props.totalItems() > 0 && props.pageRange().start > 0}
      fallback={<span>No entries to display</span>}
    >
      {`Showing ${props.pageRange().start}–${props.pageRange().end} of ${props.totalItems()}`}
    </Show>
  </div>
  <div class="flex items-center gap-3">
    <Button
      variant="link"
      size="sm"
      onClick={props.onPrevious}
      disabled={!props.canGoPrevious()}
    >
      ← Prev
    </Button>
    <span>
      Page {props.displayPage()} / {props.displayTotalPages()}
    </span>
    <Button
      variant="link"
      size="sm"
      onClick={props.onNext}
      disabled={!props.canGoNext()}
    >
      Next →
    </Button>
  </div>
</div>
```

- [ ] **Step 5: Verify**

Run: `cd apps/web && bun run test:unit WishlistDashboard` then `bun check-types` then `bun lint`
Expected: PASS. (Re-point tests that asserted old copy like "No items in this category yet" or "Loading your wishlist..." to the new strings.)

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/components/WishlistDashboard.tsx
git commit -m "feat(web): TOC sidebar, ledger pagination, editorial states

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 16: Restyle `WishlistFilters`

**Files:**

- Read then Modify: `apps/web/src/components/WishlistFilters.tsx`

- [ ] **Step 1: Read the file**

Run: `cat apps/web/src/components/WishlistFilters.tsx`
Catalogue every hardcoded color/gradient/shadow/emoji and the category heading.

- [ ] **Step 2: Apply token/font rules**

Edit only classes/markup:

- Section/category heading → `font-display`.
- The "Add Item" CTA → use shared `Button` (default oxblood) with text label (no emoji); if it uses an inline `+`, keep a text "Add Item" or an inline SVG plus icon.
- Search `Input` and sort/status `Select` already inherit the new component styles — just ensure any wrapper uses `border-border`, no `shadow-*`/`bg-card/80`.
- Labels → `font-mono text-xs uppercase tracking-wide text-muted-foreground`.
- Replace any emoji with inline SVG or text.
- Keep all props (`searchQuery`, `setSearchQuery`, `sortBy`, `setSortBy`, `statusFilter`, `setStatusFilter`, `onAddItem`, `isSelectionMode`, `onToggleSelectionMode`, `hasItems`, `categoryName`) and handlers unchanged.

- [ ] **Step 3: Verify**

Run: `cd apps/web && bun run test:unit WishlistFilters` then `bun check-types` then `bun lint`
Expected: PASS. (Update assertions tied to removed styling/emoji to target labels/roles.)

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/components/WishlistFilters.tsx
git commit -m "feat(web): restyle wishlist filters to paper theme

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 17: Restyle `RecentItemsWidget`

**Files:**

- Read then Modify: `apps/web/src/components/RecentItemsWidget.tsx`

- [ ] **Step 1: Read the file**

Run: `cat apps/web/src/components/RecentItemsWidget.tsx`

- [ ] **Step 2: Apply token/font rules**

- Container → `border border-border bg-card rounded-sm`, no `shadow-*`/`backdrop-blur`/gradients.
- Widget heading → `font-display` (or `font-mono` uppercase if it's a small eyebrow label).
- Item titles → `font-serif`; timestamps/metadata → `font-mono text-xs text-muted-foreground`.
- Replace emoji with SVG/text.
- Keep props (`categories`, `onViewItem`) and all logic unchanged.

- [ ] **Step 3: Verify**

Run: `cd apps/web && bun run test:unit RecentItemsWidget` then `bun check-types` then `bun lint`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/components/RecentItemsWidget.tsx
git commit -m "feat(web): restyle recent items widget

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 18: Restyle `BulkActionBar`

**Files:**

- Read then Modify: `apps/web/src/components/BulkActionBar.tsx`

- [ ] **Step 1: Read the file**

Run: `cat apps/web/src/components/BulkActionBar.tsx`

- [ ] **Step 2: Apply token/font rules**

- The floating bar → `border border-border bg-card` (paper), `rounded-sm`, drop `shadow-2xl`/`backdrop-blur`/gradients (a single subtle `shadow-sm` is acceptable here since it floats — but prefer a strong `border` + `bg-card`).
- Counts/labels → `font-mono text-xs uppercase tracking-wide`.
- Use shared `Button` variants: destructive for delete, outline for move/cancel, default for select-all.
- Replace emoji with SVG/text.
- Keep all props (`selectedCount`, `totalCount`, `allSelected`, `categories`, `isProcessing`, `onSelectAll`, `onClearSelection`, `onCancel`, `onDelete`, `onMove`) and behavior unchanged.

- [ ] **Step 3: Verify**

Run: `cd apps/web && bun run test:unit` (full web suite — BulkActionBar is exercised via WishlistDashboard) then `bun check-types` then `bun lint`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/components/BulkActionBar.tsx
git commit -m "feat(web): restyle bulk action bar

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 19: Restyle dialogs (`AddItemDialog`, `EditItemDialog`, `ViewItemDialog`, `LinkManager`, `CategoryManager`)

**Files:**

- Read then Modify: `apps/web/src/components/AddItemDialog.tsx`
- Read then Modify: `apps/web/src/components/EditItemDialog.tsx`
- Read then Modify: `apps/web/src/components/ViewItemDialog.tsx`
- Read then Modify: `apps/web/src/components/LinkManager.tsx`
- Read then Modify: `apps/web/src/components/CategoryManager.tsx`

> Do these as five small commits (one per file). For every dialog apply the same rules; the per-file work is only mechanical class/markup swaps.

**Shared rules for all five:**

- Backdrop → `bg-foreground/40` (no `bg-black/50`, no `backdrop-blur`).
- Panel → `rounded-sm border border-border bg-card text-card-foreground`, **no** `shadow-xl`.
- Dialog title → `font-display`; field labels → `font-mono text-xs uppercase tracking-wide text-muted-foreground`; prose/values → `font-serif`.
- Inputs/selects/buttons → use the shared components (already restyled); remove any local color overrides (`bg-purple-*`, `from-purple-*`, white buttons).
- Replace all emoji (✏️, ×, ⚙️, 🔗, etc.) with inline SVG icons or text labels with `aria-label`.
- **Do not change** any props, signals, validation, submit handlers, or callbacks.

- [ ] **Step 1: `AddItemDialog`** — read, apply shared rules, then:
      Run `cd apps/web && bun run test:unit AddItemDialog` → PASS; `bun check-types`; commit:
  ```bash
  git add apps/web/src/components/AddItemDialog.tsx
  git commit -m "feat(web): restyle add-item dialog to paper panel
  ```

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"

````

- [ ] **Step 2: `EditItemDialog`** — read, apply shared rules, then:
Run `cd apps/web && bun run test:unit EditItemDialog` → PASS; `bun check-types`; commit:
```bash
git add apps/web/src/components/EditItemDialog.tsx
git commit -m "feat(web): restyle edit-item dialog to paper panel

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
````

- [ ] **Step 3: `ViewItemDialog`** (reads like a full catalogue entry: `font-display` title, `font-serif` description, `font-mono` metadata, links as a ruled list) — read, apply rules, then:
      Run `cd apps/web && bun run test:unit ViewItemDialog` → PASS; `bun check-types`; commit:
  ```bash
  git add apps/web/src/components/ViewItemDialog.tsx
  git commit -m "feat(web): redesign view-item dialog as catalogue entry
  ```

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"

````

- [ ] **Step 4: `LinkManager`** — read, apply rules (link rows as ruled mono list, SVG icons for add/remove/primary), then:
Run `cd apps/web && bun run test:unit LinkManager` → PASS; `bun check-types`; commit:
```bash
git add apps/web/src/components/LinkManager.tsx
git commit -m "feat(web): restyle link manager

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
````

- [ ] **Step 5: `CategoryManager`** — read, apply rules (the modal `Card` already restyled; ensure backdrop/panel/labels/icons follow rules; color swatches keep their `style` background), then:
      Run `cd apps/web && bun run test:unit CategoryManager` → PASS; `bun check-types`; `bun lint`; commit:
  ```bash
  git add apps/web/src/components/CategoryManager.tsx
  git commit -m "feat(web): restyle category manager
  ```

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"

````

---

### Task 20: Web phase gate

**Files:** none (verification only)

- [ ] **Step 1: Full web suite + lint + types**

Run:
```bash
cd apps/web && bun run test:unit
bun lint
bun check-types
````

Expected: all PASS.

- [ ] **Step 2: Manual sweep of every page**

Run `cd apps/web && bun run dev` and visit `/signin`, `/signup`, `/dashboard`, `/profile`; open the Add/Edit/View dialogs, the Category manager, and toggle dark mode.
Expected: warm paper everywhere, oxblood accents, serif/mono type, hairline rules, SVG icons, no purple/pink/gradient/blur/emoji, no console errors.

- [ ] **Step 3: Grep for stragglers**

Run:

```bash
grep -rn "purple\|pink-\|backdrop-blur\|shadow-xl\|bg-clip-text\|✏️\|⚙️\|🌙\|☀️\|×<" apps/web/src
```

Expected: no matches (or only intentional ones you can justify). Fix any stragglers, then re-run Step 1 and commit if changed.

---

## PHASE 4 — Extension

### Task 21: Re-theme extension surfaces

**Files:**

- Read then Modify: `apps/extension/src/entrypoints/popup/main.tsx`
- Read then Modify: `apps/extension/src/components/WishlistView.tsx`
- Read then Modify: `apps/extension/src/components/AddToWishlist.tsx`
- Read then Modify: `apps/extension/src/components/ItemDetailsModal.tsx`
- Read then Modify: `apps/extension/src/components/CategoryManager.tsx`

> The extension already inherits the new tokens, fonts, and shared components. This task removes any **hardcoded** colors/emoji/shadows in the extension's own markup and confirms the `w-96` popup reads well.

- [ ] **Step 1: Grep the extension for hardcoded visuals**

Run:

```bash
grep -rn "purple\|pink-\|gradient\|backdrop-blur\|shadow-xl\|shadow-2xl\|bg-white\|bg-black\|✏️\|⚙️\|🌙\|☀️\|🔗" apps/extension/src
```

Note every hit; these are the only spots needing edits.

- [ ] **Step 2: Fix each hit**

For each occurrence, apply the same rules as the web app:

- Colors → semantic tokens (`bg-card`, `text-foreground`, `bg-primary`, `border-border`, `text-muted-foreground`).
- Titles → `font-display`; metadata/labels → `font-mono`; body → `font-serif`.
- Emoji → inline SVG (reuse the icon SVGs from Tasks 7/14/15) or text with `aria-label`.
- Drop `shadow-*`/`backdrop-blur`; use `border border-border`.
- Keep all logic, props, providers, and `browser.*` calls unchanged.
- The popup `LoadingScreen`/`ErrorScreen` copy in `main.tsx` may stay, but restyle to `font-mono` labels + `font-serif` body.

- [ ] **Step 3: Verify extension tests + types**

Run:

```bash
cd apps/extension && npm run test
bun check-types
bun lint
```

Expected: all PASS. (Re-point any extension test asserting removed emoji/classes to visible text/roles.)

- [ ] **Step 4: Build the extension to confirm fonts bundle**

Run: `cd apps/extension && npm run build`
Expected: build succeeds; no missing-module errors for `@fontsource-variable/*`.

- [ ] **Step 5: Commit**

```bash
git add apps/extension/src
git commit -m "feat(extension): adopt archival paper theme

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## PHASE 5 — Final sweep

### Task 22: Favicon + full repo gate

**Files:**

- Optional Create/Modify: `apps/web/public/favicon.svg` (+ reference in the document head if the app sets one)

- [ ] **Step 1: (Optional) Add a Corvus favicon**

Create `apps/web/public/favicon.svg` using the constellation paths from `CorvusMark` on a paper background:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" fill="#F4EFE6"/>
  <g transform="translate(2 6)" fill="none" stroke="#7E342A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M10 14 L46 8 L54 34 L20 46 Z" opacity="0.5"/>
    <circle cx="10" cy="14" r="2.4" fill="#7E342A"/>
    <circle cx="46" cy="8" r="3" fill="#7E342A"/>
    <circle cx="54" cy="34" r="2.2" fill="#7E342A"/>
    <circle cx="20" cy="46" r="2.6" fill="#7E342A"/>
  </g>
</svg>
```

If the web app references a favicon in its head/config, point it at this file. If favicon handling isn't obvious, skip this step (non-blocking).

- [ ] **Step 2: Whole-repo gate**

Run:

```bash
bun check-types
bun lint
cd packages/ui-components && bun run test
cd ../../apps/web && bun run test:unit
cd ../extension && npm run test
cd ../api && bun run test
```

Expected: every command PASS.

- [ ] **Step 3: Final straggler grep across both apps**

Run:

```bash
grep -rn "from-purple\|to-pink\|via-pink\|backdrop-blur\|shadow-xl\|bg-clip-text text-transparent\|bg-card/80" apps/web/src apps/extension/src
```

Expected: no matches.

- [ ] **Step 4: Commit any final fixes**

```bash
git add -A
git commit -m "chore(ui): final archival redesign sweep + favicon

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

- [ ] **Step 5: (Optional) Update the design spec status**

If desired, set the spec's `Status:` to `Implemented` and commit.

---

## Self-Review Notes (for the implementer)

- **E2E tests:** `packages/e2e` Playwright specs assert on **text/roles/URLs**, not styling, so they should be unaffected. If any e2e selector targets a class that changed, update the selector — do not change app behavior to satisfy it. Run `bun --cwd packages/e2e test` opportunistically if the environment supports it; it is not a required gate for a visual redesign.
- **Token contrast:** if any text fails contrast against paper (especially `muted-foreground` on `card`), darken `--muted-foreground` by a few % L in `styles.css` rather than overriding per-component.
- **Dark mode:** every task's classes use semantic tokens, so dark (espresso) is covered automatically; spot-check it in Task 20 Step 2.
- **Logic invariant:** no task changes a signal, effect, handler, GraphQL call, or prop. If a test only fails because it asserted old styling/emoji/copy, fix the _test's assertion_; if a test fails on behavior, you changed something you shouldn't have — revert and reapply as markup-only.
