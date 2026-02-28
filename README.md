# ai-frontend

AI-powered chat interface built with TanStack Start, Neon PostgreSQL, and Neon Auth.

![Tests](https://github.com/project-steak-holder/ai-frontend/actions/workflows/main.yml/badge.svg)
![Node](https://img.shields.io/badge/node-%3E%3D24-brightgreen)

[Project Docs](https://project-steak-holder.github.io/project-docs/)

## Prerequisites

- Node.js >= 24
- A [Neon](https://neon.tech) project with Auth enabled

## Quick Start

```bash
git clone https://github.com/project-steak-holder/ai-frontend.git
cd ai-frontend
npm install
cp .env.example .env.local
# Fill in .env.local (see Environment Variables below)
npm run db:migrate
npm run dev
```

App runs at [http://localhost:3000](http://localhost:3000).

## Environment Variables

Copy `.env.example` to `.env.local` and populate the values.

| Variable             | Required | Stage         | Description                                          |
| -------------------- | -------- | ------------- | ---------------------------------------------------- |
| `DATABASE_URL`       | Yes      | Runtime       | Neon PostgreSQL connection string                    |
| `VITE_NEON_AUTH_URL` | Yes      | Build + Runtime | Neon Auth URL from the Auth tab in Neon console    |
| `AI_SERVICE_BASE_URL`| Yes      | Runtime       | Base URL for the AI backend service                  |
| `NODE_ENV`           | No       | Runtime       | `development` \| `production` \| `test` (default: `development`) |

`VITE_NEON_AUTH_URL` is embedded into the JS bundle at build time. A separate image must be built for each environment that has a different auth URL.

### Getting Credentials

- **DATABASE_URL**: Neon console > your project > Connection Details > Connection string
- **VITE_NEON_AUTH_URL**: Neon console > Auth tab > Auth URL

## Scripts

| Command                    | Description                                          |
| -------------------------- | ---------------------------------------------------- |
| `npm run dev`              | Start dev server on port 3000                        |
| `npm run build`            | Production build to `.output/`                       |
| `npm run preview`          | Preview production build locally                     |
| `npm test`                 | Run tests with coverage (v8)                         |
| `npm run lint`             | Lint with Biome                                      |
| `npm run format`           | Format with Biome                                    |
| `npm run check`            | Biome lint + format check (runs in pre-commit hook)  |
| `npm run biome:fix`        | Auto-fix all Biome lint and format issues            |
| `npm run db:generate`      | Generate Drizzle migrations from schema changes      |
| `npm run db:migrate`       | Apply pending migrations to the database             |
| `npm run db:pull`          | Pull both public and auth schemas from the database  |
| `npm run db:pull:auth`     | Pull Neon Auth schema only                           |
| `npm run db:pull:public`   | Pull public schema only                              |
| `npm run db:studio`        | Open Drizzle Studio at http://localhost:4983          |

## Project Structure

```
src/
├── routes/                      # File-based routing (TanStack Start)
│   ├── __root.tsx               # Root layout with auth provider
│   ├── index.tsx                # Home page (redirects to sign-in)
│   ├── auth/$pathname.tsx       # Auth pages (sign-in, sign-up, etc.)
│   └── account/$pathname.tsx    # Account management pages
│
├── components/
│   ├── layout/
│   │   ├── Header.tsx           # Top navigation bar
│   │   ├── SideBar.tsx          # Conversation list sidebar
│   │   └── ChatLayout.tsx       # Chat container
│   └── ui/                      # Reusable UI primitives (shadcn-style)
│
├── lib/
│   ├── schema/                  # Drizzle ORM table schemas and types
│   │   ├── Conversations.ts
│   │   ├── Message.ts
│   │   └── User.ts
│   ├── db/index.ts              # Drizzle client
│   └── hooks/                   # React Query data hooks
│
├── server/api/                  # Server-side API route handlers
│   ├── conversations/
│   └── messages/
│
├── integrations/
│   ├── neon-auth/client.ts      # Neon Auth (Better Auth) client
│   └── tanstack-query/          # TanStack Query provider setup
│
├── env.ts                       # Environment variable validation (t3-env)
├── router.tsx                   # Router configuration
└── styles.css                   # Global styles and Tailwind imports

drizzle/                         # Generated migration files
├── public/                      # App schema migrations
└── auth/                        # Neon Auth schema (reference only)
```

**Path aliases** (configured in `tsconfig.json` and `vitest.config.ts`):

| Alias           | Resolves to         |
| --------------- | ------------------- |
| `@`             | `src/`              |
| `@lib`          | `src/lib/`          |
| `@components`   | `src/components/`   |
| `@server`       | `src/server/`       |
| `@integrations` | `src/integrations/` |
| `@drizzle`      | `drizzle/`          |

## Testing

```bash
npm test                        # Run all tests with coverage
npm test -- --watch             # Watch mode
npm test -- --ui                # Vitest browser UI
```

Tests use Vitest with `jsdom`, `@testing-library/react`, and v8 coverage. Coverage thresholds: 75% statements, 75% lines, 70% functions, 60% branches. Coverage excludes generated files, UI primitives, and integration boilerplate.

Test files live alongside source files with `.test.ts` or `.test.tsx` extensions.

## Database Migrations

```bash
# After editing a schema file in src/lib/schema/
npm run db:generate   # Creates SQL in drizzle/public/
npm run db:migrate    # Applies it to the database
```

## Deployment

### Docker

The Dockerfile uses a two-stage build. The builder compiles the app; the runner copies only `.output/` with no source or `node_modules`.

```bash
# Build
docker build \
  --build-arg VITE_NEON_AUTH_URL=https://your-auth-url.neon.tech/auth \
  -t ai-frontend .

# Run
docker run \
  -e DATABASE_URL=postgresql://... \
  -e AI_SERVICE_BASE_URL=https://your-ai-service \
  -p 3000:3000 \
  ai-frontend
```

| Variable             | Provided at | Description                        |
| -------------------- | ----------- | ---------------------------------- |
| `VITE_NEON_AUTH_URL` | Build time (`--build-arg`) | Baked into the JS bundle |
| `DATABASE_URL`       | Runtime (`-e`) | Neon PostgreSQL connection string |
| `AI_SERVICE_BASE_URL`| Runtime (`-e`) | AI backend base URL            |
| `PORT`               | Runtime (`-e`) | Server port (default: `3000`)  |

### CI/CD — Google Cloud Run

Pushes to `main` trigger `.github/workflows/deploy.yml`, which:

1. Authenticates to GCP via Workload Identity Federation
2. Builds and pushes the Docker image to Artifact Registry (tagged with the commit SHA and `latest`)
3. Deploys the SHA-tagged image to Cloud Run

`DATABASE_URL` and `AI_SERVICE_BASE_URL` are injected from GCP Secret Manager at deploy time. `VITE_NEON_AUTH_URL` is passed as a build-arg from the `VITE_NEON_AUTH_URL` Actions variable.

Pull requests to `main` run `.github/workflows/main.yml` (lint, check, build, test).

**Required GitHub secrets/variables for deploy workflow:**

| Name                            | Type     | Description                        |
| ------------------------------- | -------- | ---------------------------------- |
| `GCP_WORKLOAD_IDENTITY_PROVIDER`| Secret   | Workload Identity Federation provider |
| `GCP_SERVICE_ACCOUNT`           | Secret   | GCP service account email          |
| `GCP_PROJECT_ID`                | Variable | GCP project ID                     |
| `GCP_REGION`                    | Variable | GCP region (e.g. `us-central1`)    |
| `ARTIFACT_REGISTRY_REPO`        | Variable | Artifact Registry repository name  |
| `CLOUD_RUN_SERVICE`             | Variable | Cloud Run service name             |
| `VITE_NEON_AUTH_URL`            | Variable | Neon Auth URL for build            |

## Troubleshooting

**Database connection fails** — Check that `DATABASE_URL` is correct and the Neon project is not suspended.

**Auth not working** — Verify `VITE_NEON_AUTH_URL` is set at build time (not just runtime). Check browser console for CORS errors and confirm OAuth providers are enabled in the Neon Auth console.

**Type errors after schema change** — Run `npm run db:pull` to sync generated types, then restart the TypeScript language server in your editor.

## License

Private — all rights reserved.
