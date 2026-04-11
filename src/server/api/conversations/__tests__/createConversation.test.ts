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
// Module mocks – must be declared before imports
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

// Import after mocks
const { createConversation } = await import("../createConversation");

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("createConversation", () => {
	beforeEach(() => {
		dbMock = createDbChainMock();
		vi.clearAllMocks();
	});

	it("inserts a conversation and returns it", async () => {
		const expected = {
			id: VALID_CONVERSATION_ID,
			userId: VALID_USER_ID,
			name: "My Chat",
		};
		dbMock.resolveWith([expected]);

		const result = await (createConversation as unknown as ServerFn)({
			userId: VALID_USER_ID,
			name: "My Chat",
		});

		expect(dbMock.insert).toHaveBeenCalled();
		expect(dbMock.values).toHaveBeenCalled();
		expect(dbMock.returning).toHaveBeenCalled();
		expect(result).toEqual(expected);
	});

	it("throws on invalid userId (not a UUID)", async () => {
		await expect(
			(createConversation as unknown as ServerFn)({
				userId: "not-a-uuid",
				name: "Chat",
			}),
		).rejects.toThrow();
	});

	it("throws on empty name", async () => {
		await expect(
			(createConversation as unknown as ServerFn)({
				userId: VALID_USER_ID,
				name: "",
			}),
		).rejects.toThrow();
	});

	it("throws on missing userId", async () => {
		await expect(
			(createConversation as unknown as ServerFn)({ name: "Chat" }),
		).rejects.toThrow();
	});

	it("propagates database errors", async () => {
		dbMock.rejectWith(new Error("DB connection failed"));

		await expect(
			(createConversation as unknown as ServerFn)({
				userId: VALID_USER_ID,
				name: "Chat",
			}),
		).rejects.toThrow("DB connection failed");
	});
});
