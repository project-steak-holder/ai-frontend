import { type Page, test, expect } from "@playwright/test";

async function createConversation(page: Page, name: string) {
	await page.goto("/");
	await page.getByRole("button", { name: /new conversation/i }).first().click();
	await page.getByPlaceholder("Requirements Elicitation").fill(name);
	await page.getByRole("button", { name: "Create" }).click();
	await page.waitForURL(/\/chat\/.+/);
}

test.describe("chat input constraints", () => {
	test("chat input enforces maxLength of 5000 characters", async ({ page }) => {
		await createConversation(page, "Input Constraint Test");

		const input = page.getByPlaceholder("Type a message...");

		const maxLength = await input.getAttribute("maxLength");
		expect(maxLength).toBe("5000");
	});

	test("chat input cannot accept more than 5000 characters", async ({ page }) => {
		await createConversation(page, "Input Limit Test");

		const input = page.getByPlaceholder("Type a message...");

		const longText = "a".repeat(6000);
		await input.pressSequentially(longText);

		const actualValue = await input.inputValue();
		expect(actualValue.length).toBeLessThanOrEqual(5000);
	});

	test("chat input accepts exactly 5000 characters", async ({ page }) => {
		await createConversation(page, "Max Input Test");

		const input = page.getByPlaceholder("Type a message...");

		const text5000 = "x".repeat(5000);
		await input.pressSequentially(text5000);

		const actualValue = await input.inputValue();
		expect(actualValue.length).toBe(5000);
	});

	test("chat input allows normal message submission within limit", async ({ page }) => {
		await createConversation(page, "Normal Message Test");

		const input = page.getByPlaceholder("Type a message...");

		await input.fill("This is a normal test message");
		await input.press("Enter");

		const userMessage = page.getByTestId("user-message").first();
		await expect(userMessage).toBeVisible({ timeout: 20_000 });
		await expect(userMessage).toContainText("This is a normal test message");

		const inputValue = await input.inputValue();
		expect(inputValue).toBe("");
	});

	test("chat input accepts 4999 characters", async ({ page }) => {
		await createConversation(page, "Large Message Test");

		const input = page.getByPlaceholder("Type a message...");

		const text4999 = "m".repeat(4999);
		await input.fill(text4999);

		const actualValue = await input.inputValue();
		expect(actualValue.length).toBe(4999);
	});
});
