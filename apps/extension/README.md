# Corvus Wishlist Browser Extension

A modern browser extension built with SolidJS and WXT that allows users to bookmark and organize web pages into categorized wishlists.

## Features

- **Quick Bookmarking**: Save the current page to your wishlist with one click
- **Category Organization**: Organize bookmarks into customizable categories
- **Local Storage**: All data is stored locally in your browser
- **Modern UI**: Clean, responsive interface built with Shadcn components
- **Cross-Browser**: Compatible with Chrome, Firefox, and other modern browsers

## Usage

### Adding Pages to Wishlist

1. Click the extension icon in your browser toolbar
2. Click "Add Page" to bookmark the current page
3. Select a category from the dropdown
4. Optionally add a description
5. Click "Add to Wishlist"

### Managing Your Wishlist

- **View All Items**: The main view shows all your bookmarked pages
- **Filter by Category**: Click category buttons to filter items
- **Open Pages**: Click "Open" on any item to visit the page in a new tab
- **Remove Items**: Click "Remove" to delete items from your wishlist

### Managing Categories

1. Click "Categories" in the main view
2. Add new categories with custom names
3. Remove categories (items will be moved to the first remaining category)
4. Each category gets a random color for visual distinction

## Development

### Prerequisites

- Node.js >= 18
- pnpm package manager

### Setup

```bash
# Install dependencies
pnpm install

# Start development mode
pnpm dev

# Build for production
pnpm build

# Build for Firefox
pnpm build:firefox
```

### Loading in Browser

#### Chrome/Edge

1. Open `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `.output/chrome-mv3` folder

#### Firefox

1. Open `about:debugging`
2. Click "This Firefox"
3. Click "Load Temporary Add-on"
4. Select the `manifest.json` file from `.output/firefox-mv2`

## Technical Details

- **Framework**: SolidJS for reactive UI
- **Build Tool**: WXT for cross-browser extension development
- **Styling**: Tailwind CSS with Shadcn design system
- **Storage**: Browser localStorage API
- **Permissions**: `activeTab` and `storage`

## File Structure

```
src/
├── components/           # UI components
│   ├── AddToWishlist.tsx    # Add page form
│   ├── WishlistView.tsx     # Main wishlist display
│   └── CategoryManager.tsx  # Category management
├── entrypoints/         # Extension entry points
│   ├── popup/              # Popup UI
│   └── content.ts          # Content script
├── types/               # TypeScript types
│   └── wishlist.ts         # Wishlist data types
└── utils/               # Utility functions
    ├── storage.ts          # localStorage wrapper
    └── page-info.ts        # Current page info
```

## Data Structure

The extension stores data in localStorage with the following structure:

```typescript
interface WishlistData {
  categories: WishlistCategory[];
  items: WishlistItem[];
}

interface WishlistCategory {
  id: string;
  name: string;
  color?: string;
  createdAt: Date;
}

interface WishlistItem {
  id: string;
  title: string;
  url: string;
  description?: string;
  categoryId: string;
  favicon?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

## Default Categories

The extension comes with three default categories:

- **General** (Indigo)
- **Work** (Green)
- **Personal** (Red)

Users can add custom categories and remove existing ones (except the last remaining category).
