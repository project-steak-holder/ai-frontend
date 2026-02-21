import {env} from "@/env";

import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  out: './drizzle/public',
  schema: './src/lib/schema/index.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: env.DATABASE_URL,
  },
  schemaFilter: 'public',
});
