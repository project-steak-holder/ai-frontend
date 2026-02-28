import { test, expect } from "@playwright/test";

test.describe("chat", () => {
	test("home page loads and shows new conversation button", async ({ page }) => {
		await page.goto("/");
		await expect(page.getByRole("button", { name: /new conversation/i }).first()).toBeVisible();
	});

	test("can create a conversation", async ({ page }) => {
		await page.goto("/");

		await page.getByRole("button", { name: /new conversation/i }).first().click();
		await expect(page.getByRole("dialog")).toBeVisible();

		await page.getByPlaceholder("Requirements Elicitation").fill("E2E Test Conversation");
		await page.getByRole("button", { name: "Create" }).click();

		await page.waitForURL(/\/chat\/.+/);
		await expect(page.getByPlaceholder("Type a message...")).toBeVisible();
	});

	test("can send a message and receive a response", async ({ page }) => {
		await page.goto("/");

		// Create a conversation
		await page.getByRole("button", { name: /new conversation/i }).first().click();
		await page.getByPlaceholder("Requirements Elicitation").fill("E2E Test");
		await page.getByRole("button", { name: "Create" }).click();
		await page.waitForURL(/\/chat\/.+/);

		// Send a message
		const input = page.getByPlaceholder("Type a message...");
		await input.fill("Hello");
		await input.press("Enter");

		// User message appears immediately
		await expect(page.getByTestId("user-message").first()).toBeVisible();
		await expect(page.getByTestId("user-message").first()).toContainText("Hello");

		// AI response appears (structure only — not content)
		await expect(page.getByTestId("ai-message").first()).toBeVisible({
			timeout: 30_000,
		});
	});

	test("messages persist on page reload", async ({ page }) => {
		await page.goto("/");

		// Create a conversation and send a message
		await page.getByRole("button", { name: /new conversation/i }).first().click();
		await page.getByPlaceholder("Requirements Elicitation").fill("Persistence Test");
		await page.getByRole("button", { name: "Create" }).click();
		await page.waitForURL(/\/chat\/.+/);

		const url = page.url();

		await page.getByPlaceholder("Type a message...").fill("Persist this");
		await page.getByPlaceholder("Type a message...").press("Enter");

		// Wait for AI response before reloading
		await expect(page.getByTestId("ai-message").first()).toBeVisible({
			timeout: 200_000,
		});

		// Reload and verify messages are still there
		await page.goto(url);
		await expect(page.getByTestId("user-message").first()).toContainText("Persist this");
		await expect(page.getByTestId("ai-message").first()).toBeVisible();
	});
});
