import { fileURLToPath, URL } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";
import viteTsConfigPaths from "vite-tsconfig-paths";

const config = defineConfig({
	resolve: {
		alias: {
			"@": fileURLToPath(new URL("./src", import.meta.url)),
			"@drizzle": fileURLToPath(new URL("./drizzle", import.meta.url)),
			"@integrations": fileURLToPath(
				new URL("./src/integrations", import.meta.url),
			),
			"@lib": fileURLToPath(new URL("./src/lib", import.meta.url)),
			"@components": fileURLToPath(
				new URL("./src/components", import.meta.url),
			),
			"@server": fileURLToPath(new URL("./src/server", import.meta.url)),
		},
	},
	plugins: [
		devtools(),
		nitro(),
		viteTsConfigPaths({
			projects: ["./tsconfig.json"],
		}),
		tailwindcss(),
		tanstackStart(),
		viteReact(),
	],
});

export default config;
