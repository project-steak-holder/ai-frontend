import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	type ServerFn,
	VALID_CONVERSATION_ID,
	VALID_USER_ID,
	mockCreateServerFn,
} from "../../__tests__/helpers";

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

/**
 * getMessagesByConversationId makes TWO db queries:
 *   1. Ownership check on `Conversation`
 *   2. Fetch messages from `Message`
 *
 * We use a call-counting approach: the first `select()` call resolves with
 * `ownershipResult`, the second with `messagesResult`.
 */

let ownershipResult: unknown[];
let messagesResult: unknown[];
let messagesError: Error | null;
let selectCallCount: number;

vi.mock("@tanstack/react-start", () => ({
	createServerFn: mockCreateServerFn(),
}));

vi.mock("@/lib/db", () => ({
	get db() {
		return new Proxy(
			{},
			{
				get(_, prop) {
					if (prop === "select") {
						return (..._args: unknown[]) => {
							selectCallCount++;
							const currentCall = selectCallCount;
							const makeChainable = (): unknown =>
								new Proxy(
									{},
									{
										get(__, p) {
											if (p === "then") {
												if (currentCall === 1) {
													const data = ownershipResult;
													return (
														resolve: (v: unknown) => void,
														reject: (e: unknown) => void,
													) => Promise.resolve(data).then(resolve, reject);
												}
												// Second call: messages fetch
												if (messagesError) {
													return (
														_resolve: (v: unknown) => void,
														reject: (e: unknown) => void,
													) => Promise.reject(messagesError).then(_resolve, reject);
												}
												const data = messagesResult;
												return (
													resolve: (v: unknown) => void,
													reject: (e: unknown) => void,
												) => Promise.resolve(data).then(resolve, reject);
											}
											return (..._a: unknown[]) => makeChainable();
										},
									},
								);
							return makeChainable();
						};
					}
					return () => {};
				},
			},
		);
	},
}));

vi.mock("@/lib/schema/runtime", () => ({
	Conversation: { id: "id", userId: "user_id" },
	Message: {
		conversationId: "conversation_id",
		userId: "user_id",
		createdAt: "created_at",
	},
}));

const { getMessagesByConversationId } = await import(
	"../getMessagesByConversationId"
);

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("getMessagesByConversationId", () => {
	beforeEach(() => {
		selectCallCount = 0;
		ownershipResult = [{ id: VALID_CONVERSATION_ID }];
		messagesResult = [];
		messagesError = null;
		vi.clearAllMocks();
	});

	it("returns messages when conversation is owned by user", async () => {
		messagesResult = [
			{ id: "m1", content: "Hello", type: "USER" },
			{ id: "m2", content: "Hi there", type: "AI" },
		];

		const result = await (getMessagesByConversationId as unknown as ServerFn)({
			conversationId: VALID_CONVERSATION_ID,
			userId: VALID_USER_ID,
		});

		expect(result).toEqual(messagesResult);
	});

	it("returns empty array when no messages exist", async () => {
		messagesResult = [];

		const result = await (getMessagesByConversationId as unknown as ServerFn)({
			conversationId: VALID_CONVERSATION_ID,
			userId: VALID_USER_ID,
		});

		expect(result).toEqual([]);
	});

	it("throws when conversation not found (ownership)", async () => {
		ownershipResult = [];

		await expect(
			(getMessagesByConversationId as unknown as ServerFn)({
				conversationId: VALID_CONVERSATION_ID,
				userId: VALID_USER_ID,
			}),
		).rejects.toThrow("Conversation not found");
	});

	it("throws on invalid conversationId", async () => {
		await expect(
			(getMessagesByConversationId as unknown as ServerFn)({
				conversationId: "bad",
				userId: VALID_USER_ID,
			}),
		).rejects.toThrow();
	});

	it("throws on invalid userId", async () => {
		await expect(
			(getMessagesByConversationId as unknown as ServerFn)({
				conversationId: VALID_CONVERSATION_ID,
				userId: "bad",
			}),
		).rejects.toThrow();
	});

	it("throws on missing fields", async () => {
		await expect(
			(getMessagesByConversationId as unknown as ServerFn)({
				conversationId: VALID_CONVERSATION_ID,
			}),
		).rejects.toThrow();
	});

	it("propagates database errors thrown during messages fetch", async () => {
		messagesError = new Error("connection reset");

		await expect(
			(getMessagesByConversationId as unknown as ServerFn)({
				conversationId: VALID_CONVERSATION_ID,
				userId: VALID_USER_ID,
			}),
		).rejects.toThrow("connection reset");
	});
});
