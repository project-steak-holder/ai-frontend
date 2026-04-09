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
				"**/__tests__/**",
				"src/routeTree.gen.ts",
				"src/components/ui/**",
				"src/routes/auth/**",
				"src/routes/account/**",
				"src/env.ts",
				"src/router.tsx",
				"**/integrations/**",
				"**/index.ts",
				"**/runtime.ts",
				"**/types.ts"
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
