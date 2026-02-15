import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
	server: {
		DATABASE_URL: z.url(),
		NODE_ENV: z.enum(["development", "production", "test"]),
	},
	clientPrefix: "VITE_",
	client: {
		VITE_NEON_AUTH_URL: z.url(),
	},
	runtimeEnv: process?.env ?? import.meta.env,
	emptyStringAsUndefined: true,
});
