# AI Frontend

An AI-powered chat application built with TanStack Start and Neon PostgreSQL, featuring user authentication and conversation management.

## Overview

This project provides a modern web interface for AI-powered conversations. Users can sign in, create multiple conversations, and interact with an AI assistant. The application leverages TanStack Start's file-based routing, server-side rendering capabilities, and integrates seamlessly with Neon's serverless PostgreSQL database and authentication system.

## Tech Stack

### Core Framework

- **TanStack Start** - Full-stack React framework with file-based routing
- **TanStack Router** - Type-safe routing with nested layouts
- **TanStack Query** - Server state management and data fetching
- **React 24** - Latest React with concurrent features

### Database & Authentication

- **Neon PostgreSQL** - Serverless PostgreSQL database
- **Neon Auth** - Built-in authentication with Better Auth integration
- **Drizzle ORM** - Type-safe SQL query builder and migrations

### Styling & UI

- **Tailwind CSS v4** - Utility-first CSS framework
- **Radix UI** - Accessible component primitives
- **Lucide React** - Icon library
- **Sonner** - Toast notifications

### Build & Development

- **Vite 7** - Fast build tool and dev server
- **TypeScript 5.7** - Type safety
- **Biome** - Fast linter and formatter
- **Vitest** - Unit testing framework

## Prerequisites

- Node.js >= 24
- npm
- A [Neon](https://neon.tech) account with:
  - A PostgreSQL database
  - Neon Auth configured

## Getting Started

### 1. Install Dependencies

```sh
npm install
```

### 2. Configure Environment Variables

Copy the example environment file:

```sh
cp .env.example .env.local
```

Edit `.env.local` and add your credentials:

| Variable             | Description                                         |
| -------------------- | --------------------------------------------------- |
| `DATABASE_URL`       | Neon PostgreSQL connection string                   |
| `VITE_NEON_AUTH_URL` | Neon Auth configuration URL (from Neon console)     |
| `NODE_ENV`           | Environment: `development`, `production`, or `test` |

### 3. Set Up the Database

The project uses Drizzle ORM for database management. The schema includes a `conversation` table that references Neon Auth's user table.

**Generate and run migrations:**

```sh
npm run db:generate  # Generate migration files from schema
npm run db:migrate   # Apply migrations to database
```

**[Optional] Inspect database with Drizzle Studio:**

```sh
npm run db:studio
```

This opens a visual database browser at http://localhost:4983

### 4. Start Development Server

```sh
npm run dev
```

The application runs at [http://localhost:3000](http://localhost:3000)

## Project Structure

```
ai-frontend/
├── src/
│   ├── routes/                     # File-based routing (TanStack Start)
│   │   ├── __root.tsx             # Root layout with auth provider
│   │   ├── index.tsx              # Home page (sign-in redirect)
│   │   ├── auth/
│   │   │   └── $pathname.tsx     # Auth routes (sign-in, sign-up, etc.)
│   │   └── account/
│   │       └── $pathname.tsx     # Account management pages
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Header.tsx        # Top navigation bar
│   │   │   ├── SideBar.tsx       # Conversation list sidebar
│   │   │   └── ChatLayout.tsx    # Chat container (in development)
│   │   │
│   │   └── ui/                   # Reusable UI components (shadcn-style)
│   │       ├── button.tsx
│   │       ├── input.tsx
│   │       ├── card.tsx
│   │       └── ...               # 50+ UI components
│   │
│   ├── lib/
│   │   ├── schema/               # Drizzle ORM schemas
│   │   │   ├── index.ts         # Schema exports
│   │   │   ├── Conversations.ts # Conversation table schema
│   │   │   ├── Message.ts       # Message types
│   │   │   └── User.ts          # User types
│   │   │
│   │   ├── db/
│   │   │   └── index.ts         # Drizzle client setup
│   │   │
│   │   ├── hooks/               # React Query hooks (placeholders)
│   │   │   ├── useConversations.ts
│   │   │   ├── useMessages.ts
│   │   │   └── useStreamingResponse.ts
│   │   │
│   │   └── utils.ts            # Utility functions
│   │
│   ├── server/
│   │   └── api/                # Server-side API routes (placeholders)
│   │       ├── conversations/
│   │       │   └── index.ts
│   │       └── messages/
│   │           └── index.ts
│   │
│   ├── integrations/
│   │   ├── neon-auth/
│   │   │   └── client.ts       # Neon Auth client setup
│   │   │
│   │   └── tanstack-query/
│   │       ├── root-provider.tsx
│   │       └── devtools.tsx
│   │
│   ├── hooks/                  # Custom hooks
│   │   └── use-mobile.ts
│   │
│   ├── styles.css             # Global styles and Tailwind imports
│   ├── router.tsx             # Router configuration
│   └── env.ts                 # Environment variable validation
│
├── drizzle/                   # Generated migrations
│   ├── public/               # Public schema migrations
│   └── auth/                 # Neon Auth schema (for reference)
│
├── drizzle.config.ts         # Drizzle Kit configuration
├── drizzle.config.auth.ts    # Neon Auth schema config
├── vite.config.ts            # Vite configuration
├── vitest.config.ts          # Vitest test configuration
└── tsconfig.json             # TypeScript configuration
```

**Path Alias:** The `@` alias maps to `./src/` for cleaner imports.

## Database Types

- /src/lib/schema holds the type definitions for Conversation, Message and User types

## Authentication

The app uses Neon Auth (powered by Better Auth) with the following features:

- Email/password authentication
- Google OAuth (configured in root layout)
- Username support
- Remember me functionality
- Forgot password flow
- Protected routes with automatic redirects

**Auth Components:**

- Sign-in/Sign-up forms automatically rendered at `/auth/*`
- Account management UI at `/account/*`
- User button in the header for quick access

## Scripts

| Command                  | Description                                     |
| ------------------------ | ----------------------------------------------- |
| `npm run dev`            | Start dev server on port 3000                   |
| `npm run build`          | Production build                                |
| `npm run preview`        | Preview production build                        |
| `npm run test`           | Run tests with Vitest                           |
| `npm run format`         | Format code with Biome                          |
| `npm run lint`           | Lint code with Biome                            |
| `npm run check`          | Run Biome checks (used in pre-commit hook)      |
| `npm run db:generate`    | Generate Drizzle migrations from schema changes |
| `npm run db:migrate`     | Apply migrations to database                    |
| `npm run db:pull`        | Pull schema from database (both public & auth)  |
| `npm run db:pull:auth`   | Pull Neon Auth schema only                      |
| `npm run db:pull:public` | Pull public schema only                         |
| `npm run db:studio`      | Open Drizzle Studio visual database editor      |

## Development Workflow

### Making Schema Changes

1. Edit schema files in `src/lib/schema/`
2. Generate migration: `npm run db:generate`
3. Review generated SQL in `drizzle/public/`
4. Apply migration: `npm run db:migrate`

### Working with Authentication

The auth system is fully configured. User session is available via:

```typescript
import { authClient } from "@/integrations/neon-auth/client";

function MyComponent() {
  const { data } = authClient.useSession();
  const user = data?.user;
  const session = data?.session;

  // ...
}
```

### Adding New Routes

Create files in `src/routes/`:

- `src/routes/chat.tsx` → `/chat`
- `src/routes/chat/new.tsx` → `/chat/new`
- `src/routes/chat/$id.tsx` → `/chat/:id` (dynamic route)

TanStack Router auto-generates type-safe route definitions.

## Key Features

### Implemented

- User authentication with Google OAuth and email/password
- Protected routes with automatic sign-in redirects
- Responsive layout with header and sidebar
- Dark theme with Tailwind CSS
- Database connection with Drizzle ORM
- Conversation schema with user relationships
- Type-safe database queries
- Comprehensive UI component library

### In Development

- Chat interface (ChatLayout component)
- Message storage and retrieval
- AI integration for responses
- Real-time message streaming
- Conversation management (create, list, delete)
- User preferences and settings

## Environment Variables

### Required Variables

```sh
# Database connection (from Neon console)
DATABASE_URL=postgresql://username:password@ep-xxx.region.neon.tech/dbname

# Auth configuration (from Neon Auth dashboard)
VITE_NEON_AUTH_URL=https://your-auth-endpoint.neon.tech/auth

# Environment
NODE_ENV=development
```

### Getting Credentials

1. **DATABASE_URL:**
   - Go to [Neon Console](https://console.neon.tech)
   - Select your project
   - Navigate to "Connection Details"
   - Copy the "Connection string"

2. **VITE_NEON_AUTH_URL:**
   - In Neon Console, go to "Auth" tab
   - Copy the "Auth URL" from the configuration page
   - Enable Google OAuth if desired

## Testing

```sh
npm run test              # Run tests once
npm run test -- --watch   # Watch mode
npm run test -- --ui      # Visual UI
```

Tests are located alongside source files with `.test.ts` or `.test.tsx` extensions.

## Code Quality

The project uses Biome for linting and formatting:

```sh
npm run check   # Check all files
npm run format  # Format code
npm run lint    # Lint only
```

A pre-commit hook runs checks automatically using Husky + lint-staged.

## Deployment

### Build for Production

```sh
npm run build
```

The build output is in `.output/` directory, ready for deployment to platforms like:

- Vercel
- Netlify
- Cloudflare Pages
- Any Node.js hosting

### Environment Variables in Production

Ensure all environment variables are set in your hosting platform:

- `DATABASE_URL`
- `VITE_NEON_AUTH_URL`
- `NODE_ENV=production`

## Troubleshooting

### Database Connection Issues

- Verify `DATABASE_URL` is correct and includes all parameters
- Check Neon project is not suspended
- Ensure database accepts connections from your IP

### Auth Not Working

- Confirm `VITE_NEON_AUTH_URL` is correctly set
- Verify OAuth providers are enabled in Neon Auth console
- Check browser console for CORS errors

### Type Errors

- Run `npm run db:pull` to sync database schema types
- Restart TypeScript server in your editor

## Contributing

1. Create a feature branch from `main`
2. Make changes with descriptive commits
3. Run `npm run check` to ensure code quality
4. Push and create a pull request

The CI workflow runs tests and checks on all pull requests.

## License

Private project - all rights reserved.
