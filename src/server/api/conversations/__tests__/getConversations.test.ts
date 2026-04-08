import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	type ChainMock,
	createDbChainMock,
	mockCreateServerFn,
	type ServerFn,
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
	Conversation: { id: "id", userId: "user_id", createdAt: "created_at" },
}));

const { getConversations } = await import("../getConversations");

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("getConversations", () => {
	beforeEach(() => {
		dbMock = createDbChainMock();
		vi.clearAllMocks();
	});

	it("returns conversations for a user", async () => {
		const conversations = [
			{ id: "c1", name: "Chat 1" },
			{ id: "c2", name: "Chat 2" },
		];
		dbMock.resolveWith(conversations);

		const result = await (getConversations as unknown as ServerFn)({
			userId: VALID_USER_ID,
		});

		expect(dbMock.select).toHaveBeenCalled();
		expect(dbMock.from).toHaveBeenCalled();
		expect(dbMock.where).toHaveBeenCalled();
		expect(dbMock.orderBy).toHaveBeenCalled();
		expect(result).toEqual(conversations);
	});

	it("returns empty array when user has no conversations", async () => {
		dbMock.resolveWith([]);

		const result = await (getConversations as unknown as ServerFn)({
			userId: VALID_USER_ID,
		});

		expect(result).toEqual([]);
	});

	it("throws on invalid userId", async () => {
		await expect(
			(getConversations as unknown as ServerFn)({ userId: "bad" }),
		).rejects.toThrow();
	});

	it("throws on missing userId", async () => {
		await expect(
			(getConversations as unknown as ServerFn)({}),
		).rejects.toThrow();
	});

	it("propagates database errors", async () => {
		dbMock.rejectWith(new Error("timeout"));

		await expect(
			(getConversations as unknown as ServerFn)({ userId: VALID_USER_ID }),
		).rejects.toThrow("timeout");
	});
});
