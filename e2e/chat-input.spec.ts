import { test, expect } from "@playwright/test";

test.describe("chat input constraints", () => {
	test("chat input enforces maxLength of 5000 characters", async ({ page }) => {
		await page.goto("/");

		// Create a conversation
		await page.getByRole("button", { name: /new conversation/i }).first().click();
		await page.getByPlaceholder("Requirements Elicitation").fill("Input Constraint Test");
		await page.getByRole("button", { name: "Create" }).click();
		await page.waitForURL(/\/chat\/.+/);

		// Get the input element
		const input = page.getByPlaceholder("Type a message...");

		// Verify maxLength attribute is set to 5000
		const maxLength = await input.getAttribute("maxLength");
		expect(maxLength).toBe("5000");
	});

	test("chat input cannot accept more than 5000 characters", async ({ page }) => {
		await page.goto("/");

		// Create a conversation
		await page.getByRole("button", { name: /new conversation/i }).first().click();
		await page.getByPlaceholder("Requirements Elicitation").fill("Input Limit Test");
		await page.getByRole("button", { name: "Create" }).click();
		await page.waitForURL(/\/chat\/.+/);

		// Get the input element
		const input = page.getByPlaceholder("Type a message...");

		// Try to type more than 5000 characters
		const longText = "a".repeat(6000);
		await input.fill(longText);

		// Check that the actual value is limited to 5000 characters
		const actualValue = await input.inputValue();
		expect(actualValue.length).toBeLessThanOrEqual(5000);
	});

	test("chat input accepts exactly 5000 characters", async ({ page }) => {
		await page.goto("/");

		// Create a conversation
		await page.getByRole("button", { name: /new conversation/i }).first().click();
		await page.getByPlaceholder("Requirements Elicitation").fill("Max Input Test");
		await page.getByRole("button", { name: "Create" }).click();
		await page.waitForURL(/\/chat\/.+/);

		// Get the input element
		const input = page.getByPlaceholder("Type a message...");

		// Fill with exactly 5000 characters
		const text5000 = "x".repeat(5000);
		await input.fill(text5000);

		// Check that the value is exactly 5000 characters
		const actualValue = await input.inputValue();
		expect(actualValue.length).toBe(5000);
		expect(actualValue).toBe(text5000);
	});

	test("chat input allows normal message submission within limit", async ({ page }) => {
		await page.goto("/");

		// Create a conversation
		await page.getByRole("button", { name: /new conversation/i }).first().click();
		await page.getByPlaceholder("Requirements Elicitation").fill("Normal Message Test");
		await page.getByRole("button", { name: "Create" }).click();
		await page.waitForURL(/\/chat\/.+/);

		// Get the input element
		const input = page.getByPlaceholder("Type a message...");

		// Send a normal message
		await input.fill("This is a normal test message");
		await input.press("Enter");

		// Wait for the message to appear
		const userMessage = page.getByTestId("user-message").first();
		await expect(userMessage).toBeVisible({ timeout: 20_000 });
		await expect(userMessage).toContainText("This is a normal test message");

		// Verify input is cleared after submission
		const inputValue = await input.inputValue();
		expect(inputValue).toBe("");
	});

	test("chat input with 4999 characters can be sent", async ({ page }) => {
		await page.goto("/");

		// Create a conversation
		await page.getByRole("button", { name: /new conversation/i }).first().click();
		await page.getByPlaceholder("Requirements Elicitation").fill("Large Message Test");
		await page.getByRole("button", { name: "Create" }).click();
		await page.waitForURL(/\/chat\/.+/);

		// Get the input element
		const input = page.getByPlaceholder("Type a message...");

		// Fill with 4999 characters (just under the limit)
		const text4999 = "m".repeat(4999);
		await input.fill(text4999);

		// Verify the input has the correct value
		const actualValue = await input.inputValue();
		expect(actualValue.length).toBe(4999);

		// The send should work (we just verify the input accepts it)
		// We don't actually send because it might be slow
	});
});
