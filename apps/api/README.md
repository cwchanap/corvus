# Corvus API Server

This is the backend API server for the Corvus wishlist application, built with Hono and Cloudflare Workers.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- pnpm
- Cloudflare account (for deployment)

### Development Setup

1. **Install dependencies:**

   ```bash
   cd apps/api
   pnpm install
   ```

2. **Set up the database:**

   ```bash
   # Generate and apply database migrations
   pnpm run db:gen
   pnpm run db:migrate
   ```

3. **Start the development server:**
   ```bash
   pnpm run dev
   ```
   The API will be available at `http://localhost:8787`

## 📋 API Endpoints

### Authentication

- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/logout` - User logout

### Wishlist

- `GET /api/wishlist` - Get user's wishlist data
- `POST /api/wishlist/items` - Create new wishlist item
- `DELETE /api/wishlist/items/:id` - Delete wishlist item
- `PUT /api/wishlist/items/:id` - Update wishlist item

## 🗄️ Database

The API uses Cloudflare D1 database with the following schema:

- **users** - User accounts
- **sessions** - User sessions
- **wishlist_categories** - Item categories
- **wishlist_items** - Wishlist items

### Database Commands

```bash
# Generate migration files from schema
pnpm run db:gen

# Apply migrations to local database
pnpm run db:migrate

# List databases
npx wrangler d1 list
```

## 🔧 Configuration

### wrangler.jsonc

```json
{
  "name": "api",
  "compatibility_date": "2025-08-03",
  "main": "./src/index.tsx",
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "corvus",
      "database_id": "21169276-f379-475f-99d3-54fd1dbb2d20"
    }
  ]
}
```

## 🚀 Deployment

### Deploy to Cloudflare Workers

```bash
# Build and deploy
pnpm run deploy
```

### Environment Variables

The API automatically uses the D1 database binding configured in `wrangler.jsonc`.

## 🧪 Testing

### Manual Testing

```bash
# Start the API server
pnpm run dev

# Test endpoints with curl
curl http://localhost:8787/api/wishlist
```

### Integration Testing

The API is tested alongside the web application using Playwright e2e tests in `apps/web/tests/`.

## 📁 Project Structure

```
apps/api/
├── src/
│   ├── index.tsx              # Main Hono app
│   ├── lib/
│   │   ├── cloudflare.ts      # D1 database utilities
│   │   ├── db.ts             # Database connection
│   │   ├── auth/             # Authentication services
│   │   └── wishlist/         # Wishlist business logic
│   └── routes/               # API route handlers
│       ├── auth/
│       └── wishlist/
├── drizzle.config.ts         # Drizzle configuration
├── drizzle/                  # Generated migrations
├── wrangler.jsonc           # Cloudflare configuration
└── package.json
```

## 🔗 Integration with Web App

The API server is designed to work with the SolidJS web application:

- **Web App**: `apps/web/` - Frontend application
- **API Server**: `apps/api/` - Backend API server
- **Shared Database**: Both apps use the same D1 database

### API_BASE Configuration

In the web app, API calls use the `API_BASE` environment variable:

```typescript
const API_BASE = typeof window === "undefined" ? "http://localhost:8787" : "";
const response = await fetch(`${API_BASE}/api/wishlist`);
```

## 🛠️ Development Tips

### Local Development

1. Start the API server: `pnpm run dev`
2. Start the web app: `cd ../web && pnpm run dev`
3. Both will use the same local D1 database

### Debugging

- Check the terminal output for database connection issues
- Use `npx wrangler tail` to see live logs in production
- Database queries are logged automatically

### Common Issues

- **"Mock database" errors**: Make sure to run `pnpm run dev` instead of `vite`
- **Database connection**: Ensure D1 database is properly configured
- **CORS issues**: The API includes CORS headers for cross-origin requests

## 📚 Learn More

- [Hono Documentation](https://hono.dev/)
- [Cloudflare Workers](https://developers.cloudflare.com/workers/)
- [Cloudflare D1](https://developers.cloudflare.com/d1/)
- [Drizzle ORM](https://orm.drizzle.team/)
