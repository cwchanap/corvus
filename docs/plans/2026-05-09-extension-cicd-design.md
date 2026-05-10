# Chrome Extension CI/CD Pipeline Design

## Overview

Automate building and publishing the Corvus Chrome extension to the Chrome Web Store (private visibility) on every push to `main` that touches extension-related files.

## Approach

Use the Chrome Web Store REST API (V2) to programmatically upload the extension zip and publish it. The first upload must be done manually via the CWS dashboard to create the listing, set visibility to Private, and pass the initial review.

## Workflow: `publish-extension.yml`

### Trigger

Push to `main` with paths filter:

- `apps/extension/**`
- `packages/common/**`
- `packages/ui-components/**`

### Job Steps

1. Checkout repo
2. Setup Bun
3. Install dependencies (`bun install`)
4. Type check & lint
5. Build extension zip with production env vars:
   - `VITE_API_BASE=https://corvus.cwchanap.dev`
   - `VITE_WEB_BASE=https://corvus.cwchanap.dev`
   - Command: `cd apps/extension && npm run zip`
6. Refresh Google OAuth access token using the refresh token
7. Upload zip to Chrome Web Store via API
8. Publish via API
9. Report publish status

### Production URLs

Both API and web are served from the same Cloudflare Worker domain:

- `VITE_API_BASE=https://corvus.cwchanap.dev`
- `VITE_WEB_BASE=https://corvus.cwchanap.dev`

These are build-time variables (Vite replaces them at build time).

## GitHub Secrets

| Secret              | Description                                                          |
| ------------------- | -------------------------------------------------------------------- |
| `CWS_CLIENT_ID`     | Google OAuth client ID from GCP Console                              |
| `CWS_CLIENT_SECRET` | Google OAuth client secret from GCP Console                          |
| `CWS_REFRESH_TOKEN` | Long-lived refresh token from OAuth Playground                       |
| `CWS_PUBLISHER_ID`  | Publisher ID from CWS dashboard settings                             |
| `CWS_EXTENSION_ID`  | Extension ID from CWS dashboard (obtained after first manual upload) |

## Prerequisites (Manual Steps)

1. Register as a CWS developer ($5 fee)
2. Create GCP project, enable Chrome Web Store API
3. Configure OAuth consent screen (External, add self as test user)
4. Create OAuth client (Web application, redirect URI: `https://developers.google.com/oauthplayground`)
5. Get refresh token via OAuth Playground
6. Upload extension manually first time via CWS dashboard
7. Fill out store listing and privacy tabs
8. Set visibility to Private
9. Submit for review and wait for approval
10. Configure all 5 GitHub secrets in repo settings

## Decisions

- **Trigger**: Push to `main` (with paths filter) — publishes automatically on merge
- **Production URLs**: Hardcoded in workflow (`https://corvus.cwchanap.dev`)
- **Extension ID**: Stored as GitHub secret (not hardcoded)
- **Publishing method**: CWS REST API V2 (not browser automation)
- **First publish**: Manual via dashboard (required by CWS)
