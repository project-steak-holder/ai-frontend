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
	RawStream: class RawStream {
		body: unknown;
		opts: unknown;
		constructor(body: unknown, opts: unknown) {
			this.body = body;
			this.opts = opts;
		}
	},
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

const { streamMessage } = await import("../streamMessage");

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

describe("streamMessage", () => {
	beforeEach(() => {
		ownershipResult = [{ id: VALID_CONVERSATION_ID }];
		dbMock.resolveWithSequence([ownershipResult]);
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("returns a RawStream wrapping the AI service response body", async () => {
		const fakeBody = new ReadableStream();
		vi.spyOn(globalThis, "fetch").mockResolvedValue(
			new Response(fakeBody, { status: 200 }),
		);

		const result = await (streamMessage as unknown as ServerFn)(validInput);

		expect(globalThis.fetch).toHaveBeenCalledWith(
			"https://ai.test/api/v2/generate/stream",
			expect.objectContaining({
				method: "POST",
				headers: expect.objectContaining({
					Authorization: "Bearer jwt-token-123",
				}),
			}),
		);
		// Result should be a RawStream instance with the body
		expect(result).toHaveProperty("body");
		expect(result).toHaveProperty("opts", { hint: "text" });
	});

	it("throws when conversation not found (ownership)", async () => {
		ownershipResult = [];
		dbMock.resolveWithSequence([ownershipResult]);

		await expect(
			(streamMessage as unknown as ServerFn)(validInput),
		).rejects.toThrow("Conversation not found");
	});

	it("throws with AI service error on non-ok response", async () => {
		vi.spyOn(globalThis, "fetch").mockResolvedValue(
			new Response(JSON.stringify({ error: "Unauthorized" }), {
				status: 401,
			}),
		);

		await expect(
			(streamMessage as unknown as ServerFn)(validInput),
		).rejects.toThrow("Unauthorized");
	});

	it("throws with status code when error body is not JSON", async () => {
		vi.spyOn(globalThis, "fetch").mockResolvedValue(
			new Response("bad gateway", { status: 502 }),
		);

		await expect(
			(streamMessage as unknown as ServerFn)(validInput),
		).rejects.toThrow("Failed to stream response (502)");
	});

	it("throws when response has no body", async () => {
		// Create a response with null body
		const response = new Response(null, { status: 200 });
		Object.defineProperty(response, "body", { value: null });
		vi.spyOn(globalThis, "fetch").mockResolvedValue(response);

		await expect(
			(streamMessage as unknown as ServerFn)(validInput),
		).rejects.toThrow("No response body from AI service");
	});

	it("throws on invalid conversationId", async () => {
		await expect(
			(streamMessage as unknown as ServerFn)({
				...validInput,
				conversationId: "bad",
			}),
		).rejects.toThrow();
	});

	it("throws on empty content", async () => {
		await expect(
			(streamMessage as unknown as ServerFn)({ ...validInput, content: "" }),
		).rejects.toThrow();
	});

	it("throws on missing token", async () => {
		await expect(
			(streamMessage as unknown as ServerFn)({
				conversationId: VALID_CONVERSATION_ID,
				userId: VALID_USER_ID,
				content: "Hello",
			}),
		).rejects.toThrow();
	});

	it("propagates fetch errors", async () => {
		vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("network error"));

		await expect(
			(streamMessage as unknown as ServerFn)(validInput),
		).rejects.toThrow("network error");
	});
});
