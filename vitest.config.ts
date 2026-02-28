import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";
import viteTsConfigPaths from "vite-tsconfig-paths";
import { loadEnv } from "vite";

export default defineConfig({
	plugins: [
		viteTsConfigPaths({
			projects: ["./tsconfig.json"],
		}),
	],
	test: {
		globals: true,
		exclude: ["e2e/**", "**/node_modules/**"],
		coverage: {
			enabled: true,
			provider: "v8",
			reporter: ["text", "html"],
			exclude: [
				"**/node_modules/**",
				"**/dist/**",
				"**/coverage/**",
				"src/routeTree.gen.ts",
				"src/components/ui/**",
				"src/env.ts",
				"src/router.tsx",
				"src/styles.css",
				"src/integrations/**",
				"src/routes/**",
				"src/lib/db/**",
				"src/lib/hooks/messages/useStreamingResponse.ts",
				"src/server/**",
			],
			include: ["src/**/*.{ts,tsx}"],
			thresholds: {
				statements: 75,
				branches: 60,
				functions: 70,
				lines: 75,
			},
		},
		environment: "jsdom",
		env: loadEnv(process.env.NODE_ENV || "test", process.cwd()),
		setupFiles: ["./vitest.setup.ts"],
		typecheck: {
			enabled: true,
		},
	},
	resolve: {
		alias: {
			"@": fileURLToPath(new URL("./src", import.meta.url)),
			"@drizzle": fileURLToPath(new URL("./drizzle", import.meta.url)),
			"@integrations": fileURLToPath(new URL("./src/integrations", import.meta.url)),
			"@lib": fileURLToPath(new URL("./src/lib", import.meta.url)),
			"@components": fileURLToPath(new URL("./src/components", import.meta.url)),
			"@server": fileURLToPath(new URL("./src/server", import.meta.url)),
		},
	},
});
