# Google OAuth Auth Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Supabase password sign-in/sign-up with direct Google OAuth and Corvus-owned D1 sessions.

**Architecture:** The API owns the OAuth authorization-code callback, validates Google identity, upserts a local D1 user, creates an HttpOnly Corvus session cookie, and exposes the authenticated user through the existing GraphQL context. Web and extension clients keep using `me` and `logout`, while login/register password surfaces are removed.

**Tech Stack:** Cloudflare Workers, Hono, D1, Drizzle ORM, GraphQL Yoga, SolidJS, Bun, Vitest, Playwright.

---

## Task 1: Local Identity Schema And Session Store

**Files:**

- Modify: `apps/api/src/lib/db/schema.ts`
- Modify: `apps/api/src/lib/db/types.ts`
- Create: `apps/api/drizzle/0009_google_oauth_auth.sql`
- Modify: `apps/api/drizzle/meta/_journal.json`
- Create: `apps/api/src/lib/auth/store.ts`
- Modify: `apps/api/tests/lib/schema.test.ts`

- [ ] **Step 1: Write the failing schema/store tests**

Add expectations that `users.google_sub` is unique, `sessions.user_id` references users, and the store can be imported:

```ts
import { users, sessions } from "../../src/lib/db/schema";
import { createD1AuthStore } from "../../src/lib/auth/store";

it("defines Google users and sessions tables", () => {
  expect(users.google_sub.notNull).toBe(true);
  expect(sessions.user_id.notNull).toBe(true);
  expect(createD1AuthStore).toBeTypeOf("function");
});
```

- [ ] **Step 2: Run the schema test to verify it fails**

Run: `bun --cwd apps/api run test tests/lib/schema.test.ts`

Expected: FAIL because `users`, `sessions`, or `createD1AuthStore` are not defined.

- [ ] **Step 3: Implement schema, migration, and store**

Add D1 tables:

```ts
export const users = sqliteTable(
  "users",
  {
    id: text("id").primaryKey(),
    google_sub: text("google_sub").notNull(),
    email: text("email").notNull(),
    name: text("name").notNull(),
    avatar_url: text("avatar_url"),
    created_at: text("created_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    updated_at: text("updated_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    googleSubUnique: uniqueIndex("users_google_sub_unique").on(
      table.google_sub,
    ),
  }),
);
```

Create an `AuthStore` interface with `upsertGoogleUser`, `createSession`, `getUserBySessionId`, and `deleteSession`, implemented with Drizzle queries.

- [ ] **Step 4: Run the schema test to verify it passes**

Run: `bun --cwd apps/api run test tests/lib/schema.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

Run:

```bash
git add apps/api/src/lib/db/schema.ts apps/api/src/lib/db/types.ts apps/api/src/lib/auth/store.ts apps/api/drizzle/0009_google_oauth_auth.sql apps/api/drizzle/meta/_journal.json apps/api/tests/lib/schema.test.ts
git commit -m "feat(api): add local google auth storage"
```

## Task 2: OAuth Cookies, Token Validation, And Auth Service

**Files:**

- Create: `apps/api/src/lib/auth/cookies.ts`
- Replace: `apps/api/src/lib/auth/service.ts`
- Modify: `apps/api/src/lib/auth/index.ts`
- Replace: `apps/api/tests/auth/service.test.ts`
- Rename or replace: `apps/api/tests/auth/supabase-client.test.ts`

- [ ] **Step 1: Write failing auth service tests**

Cover:

```ts
it("builds a Google authorization URL with state");
it("rejects a callback when Google token exchange fails");
it("exchanges a code, verifies identity, upserts user, and creates a session");
it("returns null when no session id is present");
it("deletes the current session on logout");
```

Use a mocked `AuthStore`, injected `fetchImpl`, and injected `verifyIdToken` function.

- [ ] **Step 2: Run the auth tests to verify they fail**

Run: `bun --cwd apps/api run test tests/auth/service.test.ts`

Expected: FAIL because the Google service does not exist yet and Supabase methods are still present.

- [ ] **Step 3: Implement cookies and GoogleAuthService**

Implement:

```ts
export class GoogleAuthService {
  getAuthorizationUrl(state: string): string;
  handleCallback(code: string): Promise<AuthSessionResult>;
  getUser(sessionId: string | null): Promise<PublicUser | null>;
  logout(sessionId: string | null): Promise<void>;
}
```

The callback posts to `https://oauth2.googleapis.com/token`, validates the ID token using Google OIDC rules, upserts a user by `sub`, bootstraps default categories through the store implementation, and creates a finite session.

- [ ] **Step 4: Run the auth tests to verify they pass**

Run: `bun --cwd apps/api run test tests/auth/service.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

Run:

```bash
git add apps/api/src/lib/auth apps/api/tests/auth
git commit -m "feat(api): add google oauth auth service"
```

## Task 3: API Routes And GraphQL Context

**Files:**

- Modify: `apps/api/src/index.tsx`
- Modify: `apps/api/src/graphql/context.ts`
- Modify: `apps/api/src/graphql/resolvers.ts`
- Modify: `apps/api/src/graphql/schema.graphql`
- Regenerate: `apps/api/src/graphql/types.ts`
- Modify: `apps/api/tests/app.test.ts`
- Modify: `apps/api/tests/graphql/context.test.ts`
- Modify: `apps/api/tests/graphql/resolvers.test.ts`

- [ ] **Step 1: Write failing route/context/resolver tests**

Add tests for:

```ts
it("redirects /auth/google/start to Google and sets a state cookie");
it("rejects /auth/google/callback when state does not match");
it("sets a session cookie and redirects to dashboard after callback");
it("resolves GraphQL user from the Corvus session cookie");
it("logout clears the Corvus session cookie");
it("does not expose login or register mutations in the schema");
```

- [ ] **Step 2: Run focused API tests to verify they fail**

Run: `bun --cwd apps/api run test tests/app.test.ts tests/graphql/context.test.ts tests/graphql/resolvers.test.ts`

Expected: FAIL because routes, context, and schema still use Supabase/password auth.

- [ ] **Step 3: Implement routes, context, logout, and schema cleanup**

Add `GET /auth/google/start`, `GET /auth/google/callback`, and a dev-only `POST /__test__/auth/session` route guarded by `TEST_AUTH_ENABLED=1` for Playwright setup. Remove `RegisterInput`, `LoginInput`, `register`, and `login` from the GraphQL schema/resolvers. Regenerate GraphQL types with `bun --cwd apps/api run codegen`.

- [ ] **Step 4: Run focused API tests to verify they pass**

Run: `bun --cwd apps/api run test tests/app.test.ts tests/graphql/context.test.ts tests/graphql/resolvers.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

Run:

```bash
git add apps/api/src apps/api/tests apps/api/drizzle apps/api/codegen.ts
git commit -m "feat(api): wire google oauth routes"
```

## Task 4: Shared GraphQL Contract Cleanup

**Files:**

- Modify: `packages/common/src/graphql/operations/auth.ts`
- Modify: `packages/common/src/graphql/types.ts`
- Modify: `packages/common/tests/graphql-operations-auth.test.ts`
- Modify: `packages/common/tests/graphql-barrel.test.ts`
- Modify: `apps/web/src/lib/graphql/auth.ts`
- Modify: `apps/web/src/lib/graphql/auth.test.ts`
- Modify: `apps/web/src/lib/graphql/hooks/use-auth.ts`
- Modify: `apps/web/src/lib/graphql/hooks/use-auth.test.tsx`
- Modify: `apps/extension/src/lib/graphql/auth.ts`
- Modify: `apps/extension/tests/lib/graphql/auth.test.ts`

- [ ] **Step 1: Write failing contract tests**

Change tests so only `ME_QUERY`, `LOGOUT_MUTATION`, `getCurrentUser`, and `logout` are exported from auth operations. Add negative assertions that `REGISTER_MUTATION` and `LOGIN_MUTATION` are not exported.

- [ ] **Step 2: Run common/web/extension auth tests to verify they fail**

Run: `bun --cwd packages/common run test tests/graphql-operations-auth.test.ts tests/graphql-barrel.test.ts`

Expected: FAIL while password operations still exist.

- [ ] **Step 3: Remove password operation exports and hooks**

Delete shared `register`/`login` helpers and web hooks `useRegister`/`useLogin`. Keep `useCurrentUser` and `useLogout`.

- [ ] **Step 4: Run contract tests to verify they pass**

Run:

```bash
bun --cwd packages/common run test tests/graphql-operations-auth.test.ts tests/graphql-barrel.test.ts
bun --cwd apps/web run test:unit src/lib/graphql/auth.test.ts src/lib/graphql/hooks/use-auth.test.tsx
bun --cwd apps/extension run test tests/lib/graphql/auth.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

Run:

```bash
git add packages/common apps/web/src/lib/graphql apps/extension/src/lib/graphql apps/extension/tests/lib/graphql
git commit -m "refactor: remove password auth graphql operations"
```

## Task 5: Web Login/Register UI

**Files:**

- Modify: `apps/web/src/lib/graphql/client.ts`
- Modify: `apps/web/src/components/auth/LoginForm.tsx`
- Modify: `apps/web/src/components/auth/LoginForm.test.tsx`
- Delete: `apps/web/src/components/auth/RegisterForm.tsx`
- Delete: `apps/web/src/components/auth/RegisterForm.test.tsx`
- Modify: `apps/web/src/routes/register.tsx`
- Modify: `apps/web/src/routes/register.test.tsx`
- Modify: `apps/web/src/routes/profile.tsx`
- Modify: `apps/web/src/routes/profile.test.tsx`

- [ ] **Step 1: Write failing UI tests**

Assert `/login` has no email/password fields, shows "Continue with Google", and clicking it navigates to the API auth start URL. Assert `/register` redirects to `/login`.

- [ ] **Step 2: Run web auth UI tests to verify they fail**

Run: `bun --cwd apps/web run test:unit src/components/auth/LoginForm.test.tsx src/routes/register.test.tsx src/routes/profile.test.tsx`

Expected: FAIL while password UI still exists.

- [ ] **Step 3: Implement Google-only login UI**

Export an auth start URL from the web GraphQL client by deriving it from `VITE_API_URL`, replace the login form with one button, remove RegisterForm, redirect register route, and remove profile signup copy.

- [ ] **Step 4: Run web auth UI tests to verify they pass**

Run: `bun --cwd apps/web run test:unit src/components/auth/LoginForm.test.tsx src/routes/register.test.tsx src/routes/profile.test.tsx`

Expected: PASS.

- [ ] **Step 5: Commit**

Run:

```bash
git add apps/web/src
git commit -m "feat(web): switch login to google sso"
```

## Task 6: E2E Updates And Final Verification

**Files:**

- Modify: `packages/e2e/playwright.config.ts`
- Modify: `packages/e2e/tests/auth-flow.test.ts`
- Modify: `packages/e2e/tests/auth.e2e.spec.ts`
- Modify: `packages/e2e/tests/bulk-operations.e2e.spec.ts`
- Modify: `packages/e2e/tests/separation.e2e.spec.ts`

- [ ] **Step 1: Write/update failing E2E expectations**

Replace password form automation with either Google-login page smoke checks or the dev-only `POST /__test__/auth/session` helper for authenticated wishlist tests.

- [ ] **Step 2: Run E2E auth tests to verify the old assumptions fail**

Run: `bun --cwd packages/e2e test tests/auth-flow.test.ts`

Expected: FAIL until UI and test helper expectations are aligned.

- [ ] **Step 3: Implement E2E auth setup**

Set `TEST_AUTH_ENABLED=1` for the API webServer command and add a helper that calls `/__test__/auth/session`, lets the API set a cookie, and then loads `/dashboard`.

- [ ] **Step 4: Run focused and broad verification**

Run:

```bash
bun --cwd apps/api run test
bun --cwd packages/common run test
bun --cwd apps/web run test:unit
bun --cwd apps/extension run test
bun run check-types
bun run build
```

Expected: all commands pass.

- [ ] **Step 5: Commit**

Run:

```bash
git add packages/e2e apps/api apps/web apps/extension packages/common
git commit -m "test: update auth coverage for google oauth"
```
