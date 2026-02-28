import { existsSync } from "node:fs";
import { defineConfig, devices } from "@playwright/test";

if (existsSync(".env")) {
	process.loadEnvFile(".env");
}

export default defineConfig({
	testDir: "./e2e",
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: process.env.CI ? 1 : undefined,
	reporter: process.env.CI ? "github" : "html",
	use: {
		baseURL: process.env.BASE_URL ?? "http://localhost:3000",
		trace: "on-first-retry",
	},
	projects: [
		{
			name: "setup",
			testMatch: /.*\.setup\.ts/,
		},
		{
			name: "chromium",
			use: {
				...devices["Desktop Chrome"],
				storageState: "playwright/.auth/user.json",
			},
			dependencies: ["setup"],
		},
	],
});
