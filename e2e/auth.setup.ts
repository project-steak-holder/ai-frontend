import { test as setup, expect } from "@playwright/test";
import path from "node:path";

const authFile = path.join(import.meta.dirname, "../playwright/.auth/user.json");

setup("authenticate", async ({ page }) => {
	// Navigate to the sign-in page and wait for it to load
	await page.goto("/auth/sign-in");
	await page.waitForLoadState("load");
	await page.waitForTimeout(1000);

	// Locators for the login form elements
	const usernameInput = page.getByRole('textbox', { name: 'Username' });
	const passwordInput = page.getByRole('textbox', { name: 'Password' });
	const loginButton = page.getByRole('button', { name: 'Login' });

	// Make sure login page is visible
	await expect(usernameInput).toBeVisible({ timeout: 10000 });
	await expect(passwordInput).toBeVisible({ timeout: 10000 });
	await expect(loginButton).toBeVisible({ timeout: 10000 });

	// Sign in with test credentials
	await usernameInput.fill(process.env.E2E_TEST_EMAIL!);
	await passwordInput.fill(process.env.E2E_TEST_PASSWORD!);
	await loginButton.click();

	// Wait for the main page to load after login
	await expect(page.getByRole('button', { name: 'New Conversation' }).first()).toBeVisible({ timeout: 30000 });
	
	await page.context().storageState({ path: authFile });
});
