import { test as setup, expect } from "@playwright/test";
import path from "node:path";

const authFile = path.join(import.meta.dirname, "../playwright/.auth/user.json");

setup("authenticate", async ({ page }) => {
	await page.goto("/auth/sign-in");

	await page.getByLabel("Email").fill(process.env.E2E_TEST_EMAIL!);
	await page.getByLabel("Password").fill(process.env.E2E_TEST_PASSWORD!);
	await page.getByRole("button", { name: /sign in/i }).click();

	await page.waitForURL("/");
	await expect(page.getByRole("button", { name: /new conversation/i })).toBeVisible();

	await page.context().storageState({ path: authFile });
});
