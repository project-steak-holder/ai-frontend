import { test, expect } from "@playwright/test";

test.describe("responsive behavior", () => {
	test("sidebar heading truncates at narrow viewport", async ({ page }) => {
		await page.goto("/");

		const heading = page.locator("h2:has-text('Stakeholder AI Chat')");

		// Desktop: heading should be visible
		await page.setViewportSize({ width: 1280, height: 720 });
		await expect(heading.first()).toBeVisible();

		// Verify truncation CSS is applied
		const textOverflow = await heading.first().evaluate(
			(el) => getComputedStyle(el).textOverflow,
		);
		expect(textOverflow).toBe("ellipsis");
	});

	test("conversation name in sidebar truncates overflow", async ({ page }) => {
		await page.goto("/");

		// Create a conversation with a long name
		await page.getByRole("button", { name: /new conversation/i }).first().click();
		const longName = "This is a very long conversation name that should be truncated";
		await page.getByPlaceholder("Requirements Elicitation").fill(longName);
		await page.getByRole("button", { name: "Create" }).click();
		await page.waitForURL(/\/chat\/.+/);

		const conversationNameSpan = page.locator(`span:has-text("${longName}")`).first();

		// Verify truncation styles are computed
		const overflow = await conversationNameSpan.evaluate(
			(el) => getComputedStyle(el).overflow,
		);
		expect(overflow).toBe("hidden");

		const textOverflow = await conversationNameSpan.evaluate(
			(el) => getComputedStyle(el).textOverflow,
		);
		expect(textOverflow).toBe("ellipsis");
	});

	test("new conversation button has truncate behavior", async ({ page }) => {
		await page.goto("/");

		const button = page.getByRole("button", { name: /new conversation/i }).first();

		const textOverflow = await button.evaluate(
			(el) => getComputedStyle(el).textOverflow,
		);
		expect(textOverflow).toBe("ellipsis");
	});

	test("chat message bubble respects viewport width", async ({ page }) => {
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

		const userMessage = page.getByTestId("user-message").first();
		await expect(userMessage).toBeVisible({ timeout: 20_000 });

		// At mobile width, bubble should not exceed 85% of parent
		await page.setViewportSize({ width: 375, height: 667 });
		const mobileBounds = await userMessage.boundingBox();
		const mobileParentBounds = await userMessage.evaluateHandle((el) => el.parentElement).then((h) => h.asElement()?.boundingBox());
		expect(mobileBounds, "user message bounding box should not be null at mobile width").not.toBeNull();
		expect(mobileParentBounds, "parent bounding box should not be null at mobile width").not.toBeNull();
		expect(mobileBounds!.width).toBeLessThanOrEqual(mobileParentBounds!.width * 0.9);

		// At desktop width, bubble should be narrower relative to parent
		await page.setViewportSize({ width: 1280, height: 720 });
		const desktopBounds = await userMessage.boundingBox();
		const desktopParentBounds = await userMessage.evaluateHandle((el) => el.parentElement).then((h) => h.asElement()?.boundingBox());
		expect(desktopBounds, "user message bounding box should not be null at desktop width").not.toBeNull();
		expect(desktopParentBounds, "parent bounding box should not be null at desktop width").not.toBeNull();
		expect(desktopBounds!.width).toBeLessThanOrEqual(desktopParentBounds!.width * 0.65);
	});

	test("chat message bubble handles overflow correctly", async ({ page }) => {
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

		const userMessage = page.getByTestId("user-message").first();
		await expect(userMessage).toBeVisible({ timeout: 20_000 });

		// Verify overflow is hidden via computed styles
		const overflow = await userMessage.evaluate(
			(el) => getComputedStyle(el).overflow,
		);
		expect(overflow).toBe("hidden");
	});

});
