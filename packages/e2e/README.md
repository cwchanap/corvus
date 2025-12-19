# E2E Tests

End-to-end tests for the Corvus application using Playwright.

## Running Tests

### Option 1: Auto-start servers (Recommended for CI)

Playwright will automatically start the API and web servers before running tests:

```bash
# From root directory
bun run test

# From e2e directory
cd packages/e2e
bun run test
```

### Option 2: Manual server startup (Recommended for Development)

For faster test iterations, start the servers manually in separate terminals:

```bash
# Terminal 1: Start API server
cd apps/api
bun run dev

# Terminal 2: Start web server
cd apps/web
bun run dev

# Terminal 3: Run tests with existing servers
cd packages/e2e
bun run test
```

When servers are already running, Playwright will detect and reuse them.

### Additional Test Commands

```bash
# Run tests with UI mode
bun run test:ui

# Run tests in headed mode (see the browser)
bun run test:headed

# Debug tests
bun run test:debug
```

## Test Structure

- `tests/` - Contains all test files
  - `auth.e2e.spec.ts` - Authentication flow tests
  - `auth-flow.test.ts` - Additional auth flow tests
  - `auth.test.ts` - Auth unit tests
  - `separation.e2e.spec.ts` - Separation of concerns tests

## Configuration

The Playwright configuration is in `playwright.config.ts`. It automatically:

- Starts the API server on port 5002
- Starts the web app on port 5000
- Runs tests against `http://localhost:5000`
- Uses Chromium browser by default

## Adding New Tests

1. Create a new `.spec.ts` or `.test.ts` file in the `tests/` directory
2. Import Playwright test utilities:
   ```typescript
   import { test, expect } from "@playwright/test";
   ```
3. Write your tests using Playwright's API
4. Run tests to verify they work

## CI/CD

Tests automatically:
- Fail if `test.only` is found in CI
- Retry failed tests 2 times in CI
- Run sequentially (workers: 1) in CI
