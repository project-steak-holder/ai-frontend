import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	createDbChainMock,
	mockCreateServerFn,
	type ServerFn,
	VALID_CONVERSATION_ID,
	VALID_USER_ID,
} from "../../__tests__/helpers";

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

let ownershipResult: unknown[];
const dbMock = createDbChainMock();

vi.mock("@tanstack/react-start", () => ({
	createServerFn: mockCreateServerFn(),
}));

vi.mock("@/lib/db", () => ({
	get db() {
		return dbMock;
	},
}));

vi.mock("@/lib/schema/runtime", () => ({
	Conversation: { id: "id", userId: "user_id" },
}));

vi.mock("@/env", () => ({
	env: { AI_SERVICE_BASE_URL: "https://ai.test" },
}));

const { sendMessage } = await import("../sendMessage");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const validInput = {
	conversationId: VALID_CONVERSATION_ID,
	userId: VALID_USER_ID,
	content: "Hello",
	token: "jwt-token-123",
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("sendMessage", () => {
	beforeEach(() => {
		ownershipResult = [{ id: VALID_CONVERSATION_ID }];
		dbMock.resolveWithSequence([ownershipResult]);
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("sends message to AI service and returns response", async () => {
		const aiResponse = { id: "msg-1", content: "Hi" };
		vi.spyOn(globalThis, "fetch").mockResolvedValue(
			new Response(JSON.stringify(aiResponse), {
				status: 200,
				headers: { "Content-Type": "application/json" },
			}),
		);

		const result = await (sendMessage as unknown as ServerFn)(validInput);

		expect(globalThis.fetch).toHaveBeenCalledWith(
			"https://ai.test/api/v1/generate",
			expect.objectContaining({
				method: "POST",
				headers: expect.objectContaining({
					Authorization: "Bearer jwt-token-123",
				}),
			}),
		);
		expect(result).toEqual(aiResponse);
	});

	it("throws when conversation not found (ownership)", async () => {
		ownershipResult = [];
		dbMock.resolveWithSequence([ownershipResult]);

		await expect(
			(sendMessage as unknown as ServerFn)(validInput),
		).rejects.toThrow("Conversation not found");
	});

	it("throws with AI service error message on non-ok response", async () => {
		vi.spyOn(globalThis, "fetch").mockResolvedValue(
			new Response(JSON.stringify({ message: "Rate limited" }), {
				status: 429,
			}),
		);

		await expect(
			(sendMessage as unknown as ServerFn)(validInput),
		).rejects.toThrow("Rate limited");
	});

	it("throws with status code when AI response body is not JSON", async () => {
		vi.spyOn(globalThis, "fetch").mockResolvedValue(
			new Response("internal error", { status: 500 }),
		);

		await expect(
			(sendMessage as unknown as ServerFn)(validInput),
		).rejects.toThrow("Failed to send message (500)");
	});

	it("throws on invalid conversationId", async () => {
		await expect(
			(sendMessage as unknown as ServerFn)({
				...validInput,
				conversationId: "bad",
			}),
		).rejects.toThrow();
	});

	it("throws on empty content", async () => {
		await expect(
			(sendMessage as unknown as ServerFn)({ ...validInput, content: "" }),
		).rejects.toThrow();
	});

	it("throws on missing token", async () => {
		await expect(
			(sendMessage as unknown as ServerFn)({
				conversationId: VALID_CONVERSATION_ID,
				userId: VALID_USER_ID,
				content: "Hello",
			}),
		).rejects.toThrow();
	});

	it("propagates fetch errors", async () => {
		vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("network error"));

		await expect(
			(sendMessage as unknown as ServerFn)(validInput),
		).rejects.toThrow("network error");
	});
});
