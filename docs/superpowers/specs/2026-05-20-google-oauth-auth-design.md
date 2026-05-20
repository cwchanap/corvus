# Google OAuth Auth Design

## Context

Corvus currently signs users in through Supabase Auth email/password GraphQL mutations. The rest of the product checks authentication through the `me` query and a server-managed session cookie, while wishlist ownership is stored as a text `user_id` on D1 wishlist tables.

The new direction is a clean replacement: remove password signin and signup, remove Supabase Auth from the runtime auth boundary, and make Google OAuth the only user-facing authentication path.

Primary references:

- Google OAuth web-server flow: https://developers.google.com/identity/protocols/oauth2/web-server
- Google OpenID Connect ID-token validation: https://developers.google.com/identity/openid-connect/openid-connect

## Goals

- Users sign in only with Google.
- No password fields, signup forms, password mutations, or Supabase Auth runtime dependency remain in the auth flow.
- Existing authenticated GraphQL product APIs keep using `context.user`.
- `me` and `logout` remain available so the web app and extension do not need a broader data-contract rewrite.
- New Google users get default categories through the existing idempotent bootstrap path.

## Non-Goals

- Account linking with prior Supabase users is not included.
- Password fallback, email confirmation, forgot-password, and manual registration are removed.
- Google Workspace domain restriction is not included unless added later as a product requirement.
- Accessing Google APIs after signin is not included; the OAuth flow is for authentication.

## Architecture

The API owns the OAuth flow and local session:

1. `GET /auth/google/start` creates a random `state`, stores it in a short-lived HttpOnly cookie, and redirects to Google's authorization endpoint with `response_type=code`, `scope=openid email profile`, the configured client ID, redirect URI, and state.
2. `GET /auth/google/callback` validates the returned `state`, exchanges the authorization code with Google on the server using `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and the exact redirect URI, then validates the returned ID token.
3. The API uses the ID-token `sub` claim as the stable external identity, upserts a D1 `users` row, bootstraps default categories for that local user ID, creates a D1 `sessions` row, sets a Corvus HttpOnly session cookie, and redirects to `/dashboard`.
4. GraphQL context resolves `context.user` from the Corvus session cookie and D1 session/user tables.
5. `logout` deletes the current D1 session and clears the Corvus session cookie.

The web app remains a SPA. `/login` renders a single Google SSO button that navigates to `/auth/google/start`. `/register` redirects to `/login` to preserve old links without exposing a signup surface.

The extension continues to open the web app login page when unauthenticated.

## Data Model

Add local identity tables to D1:

- `users`
  - `id text primary key`
  - `google_sub text not null unique`
  - `email text not null`
  - `name text not null`
  - `avatar_url text`
  - `created_at text not null default CURRENT_TIMESTAMP`
  - `updated_at text not null default CURRENT_TIMESTAMP`
- `sessions`
  - `id text primary key`
  - `user_id text not null references users(id) on delete cascade`
  - `expires_at text not null`
  - `created_at text not null default CURRENT_TIMESTAMP`

Wishlist tables continue storing `user_id text`. New wishlist rows use the local Corvus `users.id`.

## Security

- Google client secret is used only by the API.
- `state` is random, short-lived, HttpOnly, and must match the callback query.
- The callback must reject missing `code`, missing `state`, mismatched state, token exchange failure, missing ID token, invalid signature, invalid issuer, wrong audience, expired token, or missing `sub`.
- The implementation must not use email as the stable identity key; Google `sub` is the account key.
- Session cookies are HttpOnly, path `/`, SameSite Lax for normal web signin, Secure outside local HTTP development, and have a finite max age.
- Extension-origin GraphQL requests may need the existing cross-site cookie handling preserved for the session cookie.

## API Contract

GraphQL keeps:

- `Query.me`
- `Mutation.logout`
- all authenticated wishlist queries and mutations

GraphQL removes:

- `RegisterInput`
- `LoginInput`
- `Mutation.register`
- `Mutation.login`

HTTP auth routes are added outside GraphQL:

- `GET /auth/google/start`
- `GET /auth/google/callback`

## UI Contract

- `/login` shows one primary "Continue with Google" action and no password inputs.
- `/register` redirects to `/login`.
- Profile/dashboard sign-out continues to use `logout`.
- Copy should not mention creating a password account.

## Environment

Required API environment variables:

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REDIRECT_URI`

Existing Supabase auth environment variables are no longer required by the API auth path.

## Testing

API tests:

- OAuth start builds the correct Google redirect and sets a state cookie.
- Callback rejects state mismatch.
- Callback exchanges the code, validates ID-token claims, upserts users, bootstraps categories, creates a session, sets a session cookie, and redirects.
- GraphQL context resolves `me` from the Corvus session cookie.
- `logout` clears the session and cookie.
- Removed password mutations are absent from schema/operation tests.

Web tests:

- Login page renders only Google SSO.
- Login button navigates to `/auth/google/start`.
- Register route redirects to login.

E2E tests:

- Password login/signup flows are removed or replaced with a test-only authenticated session setup.
- Wishlist tests should authenticate through a controlled test helper rather than automating Google’s hosted UI.

## Rollout Notes

This is a breaking auth change for any existing Supabase-authenticated users. Because the previous Supabase migration explicitly assumed no production users, this design does not include account migration. If production Supabase users exist, migration must be designed before implementation.
