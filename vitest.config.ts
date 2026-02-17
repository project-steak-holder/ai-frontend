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
		environment: "node",
		env: loadEnv(process.env.NODE_ENV || "test", process.cwd()),
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
