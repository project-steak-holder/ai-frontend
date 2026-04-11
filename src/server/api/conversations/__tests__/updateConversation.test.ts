import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	type ChainMock,
	createDbChainMock,
	mockCreateServerFn,
	type ServerFn,
	VALID_CONVERSATION_ID,
	VALID_USER_ID,
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
	Conversation: { id: "id", userId: "user_id", name: "name" },
}));

const { updateConversation } = await import("../updateConversation");

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("updateConversation", () => {
	beforeEach(() => {
		dbMock = createDbChainMock();
		vi.clearAllMocks();
	});

	it("updates and returns the conversation", async () => {
		const updated = {
			id: VALID_CONVERSATION_ID,
			userId: VALID_USER_ID,
			name: "Renamed",
		};
		dbMock.resolveWith([updated]);

		const result = await (updateConversation as unknown as ServerFn)({
			id: VALID_CONVERSATION_ID,
			userId: VALID_USER_ID,
			name: "Renamed",
		});

		expect(dbMock.update).toHaveBeenCalled();
		expect(dbMock.set).toHaveBeenCalled();
		expect(dbMock.where).toHaveBeenCalled();
		expect(dbMock.returning).toHaveBeenCalled();
		expect(result).toEqual(updated);
	});

	it("throws when conversation not found (ownership check)", async () => {
		dbMock.resolveWith([]);

		await expect(
			(updateConversation as unknown as ServerFn)({
				id: VALID_CONVERSATION_ID,
				userId: VALID_USER_ID,
				name: "Renamed",
			}),
		).rejects.toThrow("Conversation not found");
	});

	it("throws on empty name", async () => {
		await expect(
			(updateConversation as unknown as ServerFn)({
				id: VALID_CONVERSATION_ID,
				userId: VALID_USER_ID,
				name: "",
			}),
		).rejects.toThrow();
	});

	it("throws on invalid id", async () => {
		await expect(
			(updateConversation as unknown as ServerFn)({
				id: "not-uuid",
				userId: VALID_USER_ID,
				name: "Chat",
			}),
		).rejects.toThrow();
	});

	it("throws on missing userId", async () => {
		await expect(
			(updateConversation as unknown as ServerFn)({
				id: VALID_CONVERSATION_ID,
				name: "Chat",
			}),
		).rejects.toThrow();
	});

	it("propagates database errors", async () => {
		dbMock.rejectWith(new Error("deadlock"));

		await expect(
			(updateConversation as unknown as ServerFn)({
				id: VALID_CONVERSATION_ID,
				userId: VALID_USER_ID,
				name: "Chat",
			}),
		).rejects.toThrow("deadlock");
	});
});
