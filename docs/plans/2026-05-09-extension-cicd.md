# Chrome Extension CI/CD Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Create a GitHub Actions workflow that automatically builds and publishes the Corvus Chrome extension to the Chrome Web Store (private) on every push to `main`.

**Architecture:** A single workflow file triggered by pushes to `main` with a paths filter. The workflow builds the extension zip with production env vars, then uses the Chrome Web Store REST API V2 to upload and publish it. Authentication uses a Google OAuth refresh token stored as a GitHub secret.

**Tech Stack:** GitHub Actions, Chrome Web Store API V2, WXT build tool, Bun

---

### Task 1: Create the publish-extension workflow

**Files:**

- Create: `.github/workflows/publish-extension.yml`

**Step 1: Write the workflow file**

```yaml
name: Publish Extension

on:
  push:
    branches: [main]
    paths:
      - "apps/extension/**"
      - "packages/common/**"
      - "packages/ui-components/**"

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  publish:
    name: Build & Publish Extension
    runs-on: ubuntu-latest
    timeout-minutes: 15

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Bun
        uses: oven-sh/setup-bun@v2
        with:
          bun-version: latest

      - name: Install dependencies
        run: bun install --frozen-lockfile

      - name: Build extension zip
        run: cd apps/extension && npm run zip
        env:
          NODE_ENV: production
          VITE_API_BASE: https://corvus.cwchanap.dev
          VITE_WEB_BASE: https://corvus.cwchanap.dev

      - name: Find extension zip
        id: find-zip
        run: |
          ZIP_PATH=$(find apps/extension/dist -name "*.zip" -type f | head -n 1)
          if [ -z "$ZIP_PATH" ]; then
            echo "ERROR: No zip file found in apps/extension/dist/"
            exit 1
          fi
          echo "zip-path=$ZIP_PATH" >> "$GITHUB_OUTPUT"
          echo "Found zip: $ZIP_PATH"

      - name: Refresh Google OAuth access token
        id: refresh-token
        run: |
          RESPONSE=$(curl -s -X POST \
            "https://oauth2.googleapis.com/token" \
            -d "client_id=${{ secrets.CWS_CLIENT_ID }}" \
            -d "client_secret=${{ secrets.CWS_CLIENT_SECRET }}" \
            -d "refresh_token=${{ secrets.CWS_REFRESH_TOKEN }}" \
            -d "grant_type=refresh_token")

          ACCESS_TOKEN=$(echo "$RESPONSE" | jq -r '.access_token // empty')
          if [ -z "$ACCESS_TOKEN" ]; then
            echo "ERROR: Failed to refresh access token"
            echo "$RESPONSE" | jq .
            exit 1
          fi
          echo "access-token=$ACCESS_TOKEN" >> "$GITHUB_OUTPUT"

      - name: Upload to Chrome Web Store
        id: upload
        run: |
          HTTP_STATUS=$(curl -s -o upload-response.json -w "%{http_code}" \
            -X POST \
            -H "Authorization: Bearer ${{ steps.refresh-token.outputs.access-token }}" \
            -T "${{ steps.find-zip.outputs.zip-path }}" \
            "https://chromewebstore.googleapis.com/upload/v2/publishers/${{ secrets.CWS_PUBLISHER_ID }}/items/${{ secrets.CWS_EXTENSION_ID }}:upload")

          echo "Upload HTTP status: $HTTP_STATUS"
          cat upload-response.json | jq .

          if [ "$HTTP_STATUS" -ne 200 ]; then
            echo "ERROR: Upload failed with status $HTTP_STATUS"
            exit 1
          fi

      - name: Publish to Chrome Web Store
        id: publish
        run: |
          HTTP_STATUS=$(curl -s -o publish-response.json -w "%{http_code}" \
            -X POST \
            -H "Authorization: Bearer ${{ steps.refresh-token.outputs.access-token }}" \
            "https://chromewebstore.googleapis.com/v2/publishers/${{ secrets.CWS_PUBLISHER_ID }}/items/${{ secrets.CWS_EXTENSION_ID }}/publish")

          echo "Publish HTTP status: $HTTP_STATUS"
          cat publish-response.json | jq .

          if [ "$HTTP_STATUS" -ne 200 ]; then
            echo "ERROR: Publish failed with status $HTTP_STATUS"
            exit 1
          fi

      - name: Report publish status
        if: always()
        run: |
          if [ "${{ steps.publish.outcome }}" = "success" ]; then
            echo "Extension published successfully!"
          else
            echo "Extension publish failed. Check logs above."
          fi
```

**Step 2: Verify YAML is valid**

Run: `cat .github/workflows/publish-extension.yml | python3 -c "import yaml, sys; yaml.safe_load(sys.stdin); print('Valid YAML')"`
Expected: `Valid YAML`

**Step 3: Commit**

```bash
git add .github/workflows/publish-extension.yml
git commit -m "ci: add extension publish workflow"
```

---

### Task 2: Verify the plan and provide setup instructions

**Step 1: Verify the workflow file is syntactically correct**

Review the workflow file for:

- Correct trigger (push to main, paths filter)
- Correct env vars for production build
- Correct CWS API endpoints
- Proper error handling on each step
- Secrets referenced correctly

**Step 2: Provide the user with the setup checklist**

Remind the user of the required GitHub secrets:

- `CWS_CLIENT_ID`
- `CWS_CLIENT_SECRET`
- `CWS_REFRESH_TOKEN`
- `CWS_PUBLISHER_ID`
- `CWS_EXTENSION_ID`

And the prerequisite manual first upload to CWS dashboard.
