# ai-frontend

A web application built with [TanStack Start](https://tanstack.com/start), React 19, and Neon PostgreSQL.

## Tech Stack

- **Framework** -- TanStack Start (TanStack Router + TanStack Query)
- **Build** -- Vite 7
- **Styling** -- Tailwind CSS v4
- **Database** -- PostgreSQL via Neon serverless + Drizzle ORM
- **Linting/Formatting** -- Biome
- **Testing** -- Vitest + Testing Library
- **Component Dev** -- Storybook

## Prerequisites

- Node.js >= 20
- npm
- A [Neon](https://neon.tech) PostgreSQL database

## Getting Started

### 1. Install dependencies

```sh
npm install
```

### 2. Configure environment variables

```sh
cp .env.example .env.local
```

Edit `.env.local` and fill in the values:

| Variable             | Description                |
| -------------------- | -------------------------- |
| `DATABASE_URL`       | Neon DB connection string  |
| `VITE_NEON_AUTH_URL` | Neon Auth configuration URL |

### 3. Set up the database

Generate migration files from the schema, then run them:

```sh
npm run db:generate
npm run db:migrate
```

Or push schema changes directly (useful during development):

```sh
npm run db:push
```

### 4. Start the dev server

```sh
npm run dev
```

The app runs at [http://localhost:3000](http://localhost:3000).

## Scripts

| Command                    | Description                            |
| -------------------------- | -------------------------------------- |
| `npm run dev`              | Start dev server on port 3000          |
| `npm run build`            | Production build                       |
| `npm run preview`          | Preview the production build           |
| `npm run test`             | Run tests with Vitest                  |
| `npm run format`           | Format code with Biome                 |
| `npm run lint`             | Lint code with Biome                   |
| `npm run check`            | Run Biome checks                       |
| `npm run db:generate`      | Generate Drizzle migrations            |
| `npm run db:migrate`       | Run Drizzle migrations                 |
| `npm run db:push`          | Push schema changes directly to DB     |
| `npm run db:pull`          | Pull schema from DB into local schema  |
| `npm run db:studio`        | Open Drizzle Studio (visual DB editor) |
| `npm run storybook`        | Start Storybook on port 6006           |
| `npm run build-storybook`  | Build Storybook for deployment         |

## Project Structure

```
src/
  db/
    schema.ts          # Drizzle database schema
  routes/              # File-based routing (TanStack Router)
drizzle/               # Generated migration files
drizzle.config.ts      # Drizzle Kit configuration
```

The `@` path alias maps to `./src`.
