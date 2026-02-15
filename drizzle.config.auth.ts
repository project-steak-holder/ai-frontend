import {env} from "@/env";

import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  out: './drizzle/auth',
  dialect: 'postgresql',
  dbCredentials: {
    url: env.DATABASE_URL,
  },
  schemaFilter: 'neon_auth',
  tablesFilter: ['user', 'session', 'account'],
});
