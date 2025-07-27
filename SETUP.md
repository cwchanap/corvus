# SolidJS Turborepo Setup - Following Latest Best Practices

## Project Structure

This monorepo has been successfully transformed from a Next.js template to a SolidJS-based setup following the latest best practices from SolidStart and WXT documentation:

### Apps

- **`apps/extension`** - Browser extension built with WXT + SolidJS (following WXT v0.19+ best practices)
- **`apps/web`** - Web application built with SolidStart (following SolidStart v1.0+ best practices)

### Packages

- **`packages/ui-components`** - Shared UI components with Shadcn + Tailwind CSS (uses `solid-library.json` config)
- **`packages/common`** - Shared utilities and types
- **`packages/eslint-config`** - ESLint configuration for SolidJS
- **`packages/typescript-config`** - TypeScript configurations including `solid-library.json` for SolidJS libraries

## Tech Stack

- **Framework**: SolidJS
- **Extension Framework**: WXT v0.19+
- **Web Framework**: SolidStart v1.0+
- **UI Components**: Shadcn + Tailwind CSS
- **Build Tool**: Turbo
- **Package Manager**: pnpm
- **Language**: TypeScript

## Best Practices Implemented

### Naming Consistency ✅

- ✅ Renamed `react-library.json` to `solid-library.json` for consistency
- ✅ Removed all React references from configurations
- ✅ Updated Turbo.json to remove Next.js build outputs
- ✅ All naming now consistently reflects SolidJS usage

### SolidStart Best Practices ✅

- ✅ Proper `src/` directory structure
- ✅ Correct entry files (`entry-client.tsx`, `entry-server.tsx`)
- ✅ File-based routing in `src/routes/`
- ✅ Proper `app.config.ts` configuration
- ✅ PostCSS and Tailwind integration
- ✅ SSR/SSG support

### WXT Best Practices ✅

- ✅ Uses `src/` directory for better organization
- ✅ Proper entrypoint folder structure (`popup/index.html` + `main.tsx`)
- ✅ Manifest v3 configuration
- ✅ SolidJS integration with Vite plugin
- ✅ Proper build scripts including Firefox support
- ✅ `postinstall` script for `wxt prepare`

## Available Commands

### Development

```bash
# Start all apps in development mode
pnpm dev

# Start specific app
pnpm dev --filter=web        # Web app (port 3000)
pnpm dev --filter=extension  # Extension development

# Firefox development
pnpm dev:firefox --filter=extension
```

### Build

```bash
# Build all apps and packages
pnpm build

# Build specific app
pnpm build --filter=web
pnpm build --filter=extension

# Build for Firefox
pnpm build:firefox --filter=extension
```

### Extension Packaging

```bash
# Create extension ZIP for Chrome
pnpm zip --filter=extension

# Create extension ZIP for Firefox
pnpm zip:firefox --filter=extension
```

### Linting & Type Checking

```bash
pnpm lint
pnpm check-types
```

## Extension Development

The browser extension is located in `apps/extension` and includes:

- **Popup UI**: SolidJS-based popup with Tailwind styling and shared UI components
- **Content Script**: Injects functionality into web pages with visual feedback
- **Manifest v3**: Modern extension manifest configuration
- **SolidJS Integration**: Full SolidJS support via WXT framework
- **Organized Structure**: Uses `src/` directory with proper entrypoint organization

### Extension Structure

```
apps/extension/
├── src/
│   └── entrypoints/
│       ├── popup/
│       │   ├── index.html
│       │   └── main.tsx
│       └── content.ts
├── wxt.config.ts
└── package.json
```

### Loading the Extension

1. Run `pnpm build --filter=extension`
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked" and select the `.output/chrome-mv3` folder

### Development

- Run `pnpm dev --filter=extension` for hot-reload development
- Run `pnpm dev:firefox --filter=extension` for Firefox development

## Web App Development

The web application is located in `apps/web` and includes:

- **SolidStart v1.0+**: Latest version with improved SSR/SSG
- **File-based Routing**: Automatic routing from `src/routes/`
- **Tailwind CSS**: Utility-first styling with PostCSS
- **Shared UI Components**: Reusable components from the monorepo
- **TypeScript**: Full type safety throughout

### Web App Structure

```
apps/web/
├── src/
│   ├── routes/
│   │   └── index.tsx
│   ├── app.tsx
│   ├── app.css
│   ├── entry-client.tsx
│   └── entry-server.tsx
├── app.config.ts
├── tailwind.config.js
└── postcss.config.js
```

## UI Components

The `packages/ui-components` package provides:

- **Button Component**: Multiple variants following Shadcn design
- **Card Components**: Header, content, footer variations
- **Tailwind Utilities**: CSS utility classes and design tokens
- **SolidJS Optimized**: Built specifically for SolidJS with proper reactivity

## Verification of Best Practices

### ✅ SolidStart Documentation Compliance

- Project structure matches official recommendations
- Entry files follow the documented patterns
- Routing implementation is correct
- Build configuration aligns with best practices

### ✅ WXT Documentation Compliance

- Uses recommended `src/` directory structure
- Entrypoint organization follows WXT conventions
- Manifest configuration is up-to-date
- Build scripts include all recommended options
- Proper TypeScript integration

## Next Steps

1. **Enhance Extension Features**: Add background scripts, options pages, or side panels
2. **Expand Web App**: Add more routes, API endpoints, or server functions
3. **UI Component Library**: Add more Shadcn components as needed
4. **Testing Setup**: Configure Vitest for both apps
5. **CI/CD Pipeline**: Set up automated builds and deployments
6. **Extension Store**: Prepare for Chrome Web Store and Firefox Add-ons submission

## Notes

- ✅ Extension now properly uses SolidJS with shared UI components
- ✅ Both apps follow their respective framework's latest best practices
- ✅ All packages share consistent TypeScript and ESLint configurations
- ✅ Turbo handles efficient build orchestration and caching
- ✅ Project structure is optimized for scalability and maintainability
