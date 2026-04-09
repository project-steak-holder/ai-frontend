import { test, expect } from "@playwright/test";

test.describe("responsive behavior", () => {
	test("sidebar heading has truncate class applied", async ({ page }) => {
		await page.goto("/");

		const heading = page.locator("h2:has-text('Stakeholder AI Chat')");
		const classes = await heading.getAttribute("class");
		expect(classes).toContain("truncate");
	});

	test("conversation name in sidebar has truncate class", async ({ page }) => {
		await page.goto("/");

		// Create a conversation with a long name
		await page.getByRole("button", { name: /new conversation/i }).first().click();
		const longName = "This is a very long conversation name that should be truncated";
		await page.getByPlaceholder("Requirements Elicitation").fill(longName);
		await page.getByRole("button", { name: "Create" }).click();
		await page.waitForURL(/\/chat\/.+/);

		// Find the span containing the conversation name (the truncate is on the span)
		const conversationNameSpan = page.locator(`span:has-text("${longName}")`).first();
		const classes = await conversationNameSpan.getAttribute("class");
		expect(classes).toContain("truncate");
	});

	test("new conversation button has truncate class applied", async ({ page }) => {
		await page.goto("/");

		const button = page.getByRole("button", { name: /new conversation/i }).first();
		const classes = await button.getAttribute("class");
		expect(classes).toContain("truncate");
	});

	test("chat message bubble has responsive max-width classes", async ({ page }) => {
		await page.goto("/");

		// Create a conversation
		await page.getByRole("button", { name: /new conversation/i }).first().click();
		await page.getByPlaceholder("Requirements Elicitation").fill("Bubble Responsive Test");
		await page.getByRole("button", { name: "Create" }).click();
		await page.waitForURL(/\/chat\/.+/);

		// Send a message
		const input = page.getByPlaceholder("Type a message...");
		await input.fill("Test message");
		await input.press("Enter");

		// Wait for user message to appear with longer timeout
		const userMessage = page.getByTestId("user-message").first();
		await expect(userMessage).toBeVisible({ timeout: 20_000 });

		// Check that responsive max-width classes are applied
		const classes = await userMessage.getAttribute("class");
		expect(classes).toContain("max-w-[85%]");
		expect(classes).toContain("sm:max-w-[70%]");
		expect(classes).toContain("md:max-w-[60%]");
		expect(classes).toContain("lg:max-w-[52%]");
	});

	test("chat message bubble has break-words and overflow-hidden classes", async ({ page }) => {
		await page.goto("/");

		// Create a conversation
		await page.getByRole("button", { name: /new conversation/i }).first().click();
		await page.getByPlaceholder("Requirements Elicitation").fill("Overflow Test");
		await page.getByRole("button", { name: "Create" }).click();
		await page.waitForURL(/\/chat\/.+/);

		// Send a message
		const input = page.getByPlaceholder("Type a message...");
		await input.fill("Test message");
		await input.press("Enter");

		// Wait for user message to appear
		const userMessage = page.getByTestId("user-message").first();
		await expect(userMessage).toBeVisible({ timeout: 20_000 });

		// Check that overflow handling classes are applied
		const classes = await userMessage.getAttribute("class");
		expect(classes).toContain("break-words");
		expect(classes).toContain("overflow-hidden");
	});

});
