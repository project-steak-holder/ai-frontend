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
		VITE_AI_SERVICE_BASE_URL: z.url(),
	},
	runtimeEnv: {
		...(typeof process !== "undefined" ? process.env : {}),
		...(typeof import.meta !== "undefined" ? import.meta.env : {}),
	},
	emptyStringAsUndefined: true,
});
