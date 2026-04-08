import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	type ChainMock,
	type ServerFn,
	VALID_CONVERSATION_ID,
	VALID_USER_ID,
	createDbChainMock,
	mockCreateServerFn,
} from "../../__tests__/helpers";

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

let dbMock: ChainMock;

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

const { getConversationById } = await import("../getConversationById");

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("getConversationById", () => {
	beforeEach(() => {
		dbMock = createDbChainMock();
		vi.clearAllMocks();
	});

	it("returns the conversation when found", async () => {
		const conversation = {
			id: VALID_CONVERSATION_ID,
			userId: VALID_USER_ID,
			name: "Chat",
		};
		dbMock.resolveWith([conversation]);

		const result = await (getConversationById as unknown as ServerFn)({
			conversationId: VALID_CONVERSATION_ID,
			userId: VALID_USER_ID,
		});

		expect(result).toEqual(conversation);
	});

	it("throws when conversation not found (wrong user)", async () => {
		dbMock.resolveWith([]);

		await expect(
			(getConversationById as unknown as ServerFn)({
				conversationId: VALID_CONVERSATION_ID,
				userId: VALID_USER_ID,
			}),
		).rejects.toThrow("Conversation not found");
	});

	it("throws on invalid conversationId", async () => {
		await expect(
			(getConversationById as unknown as ServerFn)({
				conversationId: "not-uuid",
				userId: VALID_USER_ID,
			}),
		).rejects.toThrow();
	});

	it("throws on invalid userId", async () => {
		await expect(
			(getConversationById as unknown as ServerFn)({
				conversationId: VALID_CONVERSATION_ID,
				userId: "not-uuid",
			}),
		).rejects.toThrow();
	});

	it("throws on missing fields", async () => {
		await expect(
			(getConversationById as unknown as ServerFn)({
				conversationId: VALID_CONVERSATION_ID,
			}),
		).rejects.toThrow();
	});

	it("propagates database errors", async () => {
		dbMock.rejectWith(new Error("connection reset"));

		await expect(
			(getConversationById as unknown as ServerFn)({
				conversationId: VALID_CONVERSATION_ID,
				userId: VALID_USER_ID,
			}),
		).rejects.toThrow("connection reset");
	});
});
