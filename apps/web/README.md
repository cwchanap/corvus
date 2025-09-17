# Corvus Web App

A modern SolidJS web application with authentication, built for Cloudflare Workers and D1 database.

## Features

- 🔐 **Secure Authentication** - Password hashing with Web Crypto API
- 🗄️ **Cloudflare D1 Database** - Serverless SQLite database
- 🔍 **Type-safe Queries** - Drizzle ORM with full TypeScript support
- 🎨 **Modern UI** - Tailwind CSS with shadcn/ui components
- ⚡ **Edge Deployment** - Optimized for Cloudflare Workers
- 🛡️ **Session Management** - Secure cookie-based sessions

## Tech Stack

- **Framework**: SolidJS with SolidStart
- **Database**: Cloudflare D1 (SQLite)
- **ORM**: Drizzle ORM (D1)
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui (SolidJS port)
- **Deployment**: Cloudflare Pages/Workers

## Setup

### Prerequisites

- Node.js 18+
- pnpm
- Cloudflare account
- Wrangler CLI

### Installation

1. **Install dependencies**:

   ```bash
   pnpm install
   ```

2. **Apply local database schema**:

   ```bash
   pnpm db:local
   ```

   This applies `src/lib/db/schema.sql` to your local D1 database binding `corvus`.

3. **Update configuration**:
   - Copy the database ID from the setup output
   - Update `wrangler.toml` with your database ID
   - Set a secure `SESSION_SECRET` (at least 32 characters)

4. **Start development**:
   ```bash
   pnpm dev
   ```

### Database Commands

- **Create local database**: `pnpm db:local`
- **Create remote database**: `pnpm db:remote`

## Project Structure

```
src/
├── components/
│   └── auth/           # Authentication components
├── lib/
│   ├── auth/           # Authentication logic
│   │   ├── context.tsx # Auth context provider
│   │   ├── crypto.ts   # Password hashing utilities
│   │   ├── server.ts   # Server actions
│   │   ├── service.ts  # Auth service class
│   │   └── session.ts  # Session management
│   └── db/             # Database configuration
│       ├── index.ts    # Database connection
│       ├── schema.sql  # Database schema
│       └── types.ts    # TypeScript types
└── routes/             # File-based routing
    ├── index.tsx       # Home page
    ├── login.tsx       # Login page
    ├── register.tsx    # Registration page
    └── dashboard.tsx   # Protected dashboard
```

## Authentication Flow

1. **Registration**: Users create accounts with email/password
2. **Login**: Credentials are verified against hashed passwords
3. **Sessions**: Secure sessions are created and stored in D1
4. **Protection**: Routes are protected with auth guards
5. **Logout**: Sessions are cleared and invalidated

## Database Schema

### Users Table

- `id` - Auto-incrementing primary key
- `email` - Unique email address
- `password_hash` - Hashed password
- `name` - User's full name
- `created_at` - Account creation timestamp
- `updated_at` - Last update timestamp

### Sessions Table

- `id` - Session identifier
- `user_id` - Foreign key to users table
- `expires_at` - Session expiration
- `created_at` - Session creation timestamp

## Security Features

- **Password Hashing**: PBKDF2 with 100,000 iterations
- **Secure Sessions**: HTTP-only cookies with SameSite protection
- **CSRF Protection**: Built into SolidStart server actions
- **Type Safety**: Full TypeScript coverage
- **Input Validation**: Server-side validation for all inputs

## Deployment

### Cloudflare Pages

1. **Build the application**:

   ```bash
   pnpm build
   ```

2. **Set up remote database**:

   ```bash
   pnpm db:remote
   ```

3. **Deploy with Wrangler**:
   ```bash
   npx wrangler pages deploy
   ```

### Environment Variables

Set these in your Cloudflare dashboard or `.dev.vars` for local development:

- `SESSION_SECRET` - Secret key for session encryption (32+ characters)

## Development

### Local Development

```bash
# Start development server
pnpm dev

# Run type checking
pnpm check-types

# Run linting
pnpm lint
```

### Database Management

```bash
# Connect to local D1 database
npx wrangler d1 execute corvus --command="SELECT * FROM users;"

# View database info
npx wrangler d1 info corvus
```

## API Reference

### Server Actions

- `loginAction(formData)` - Authenticate user
- `logoutAction()` - Clear user session

### Auth Context

```tsx
const auth = useAuth();

// Check authentication status
auth.isAuthenticated(); // boolean
auth.isLoading(); // boolean
auth.user(); // User | undefined
```

### Protected Routes

```tsx
import { ProtectedRoute } from "../components/auth/ProtectedRoute";

export default function Dashboard() {
  return <ProtectedRoute>{/* Protected content */}</ProtectedRoute>;
}
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details
