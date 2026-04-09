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
let andCallCount = 0;
let eqCallCount = 0;

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

// Mock drizzle-orm functions to track ownership check
vi.mock("drizzle-orm", async () => {
	const actual = await vi.importActual("drizzle-orm");
	return {
		...actual,
		and: vi.fn((...args: unknown[]) => {
			andCallCount++;
			// Return the actual and() result
			return (actual as Record<string, unknown>).and(...args);
		}),
		eq: vi.fn((field: unknown, value: unknown) => {
			eqCallCount++;
			// Return the actual eq() result
			return (actual as Record<string, unknown>).eq(field, value);
		}),
	};
});

const { deleteConversation } = await import("../deleteConversation");

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("deleteConversation", () => {
	beforeEach(() => {
		dbMock = createDbChainMock();
		andCallCount = 0;
		eqCallCount = 0;
		vi.clearAllMocks();
	});

	it("deletes and returns the conversation", async () => {
		const deleted = {
			id: VALID_CONVERSATION_ID,
			userId: VALID_USER_ID,
			name: "To Delete",
		};
		dbMock.resolveWith([deleted]);

		const result = await (deleteConversation as unknown as ServerFn)({
			id: VALID_CONVERSATION_ID,
			userId: VALID_USER_ID,
		});

		expect(dbMock.delete).toHaveBeenCalled();
		expect(dbMock.where).toHaveBeenCalled();
		expect(dbMock.returning).toHaveBeenCalled();
		expect(result).toEqual(deleted);
	});

	it("returns undefined when conversation not found", async () => {
		dbMock.resolveWith([]);

		const result = await (deleteConversation as unknown as ServerFn)({
			id: VALID_CONVERSATION_ID,
			userId: VALID_USER_ID,
		});

		expect(result).toBeUndefined();
	});

	it("throws on invalid id", async () => {
		await expect(
			(deleteConversation as unknown as ServerFn)({
				id: "not-uuid",
				userId: VALID_USER_ID,
			}),
		).rejects.toThrow();
	});

	it("throws on invalid userId", async () => {
		await expect(
			(deleteConversation as unknown as ServerFn)({
				id: VALID_CONVERSATION_ID,
				userId: "not-uuid",
			}),
		).rejects.toThrow();
	});

	it("throws on missing userId", async () => {
		await expect(
			(deleteConversation as unknown as ServerFn)({
				id: VALID_CONVERSATION_ID,
			}),
		).rejects.toThrow();
	});

	it("throws on missing id", async () => {
		await expect(
			(deleteConversation as unknown as ServerFn)({
				userId: VALID_USER_ID,
			}),
		).rejects.toThrow();
	});

	it("propagates database errors", async () => {
		dbMock.rejectWith(new Error("connection timeout"));

		await expect(
			(deleteConversation as unknown as ServerFn)({
				id: VALID_CONVERSATION_ID,
				userId: VALID_USER_ID,
			}),
		).rejects.toThrow("connection timeout");
	});

	it("enforces user ownership by using both id and userId in where clause", async () => {
		const deleted = {
			id: VALID_CONVERSATION_ID,
			userId: VALID_USER_ID,
			name: "To Delete",
		};
		dbMock.resolveWith([deleted]);

		await (deleteConversation as unknown as ServerFn)({
			id: VALID_CONVERSATION_ID,
			userId: VALID_USER_ID,
		});

		// Verify that the where clause was constructed with both id and userId conditions
		// This means both eq() and and() functions should have been called
		expect(dbMock.where).toHaveBeenCalled();
		expect(eqCallCount).toBe(2); // One for id, one for userId
		expect(andCallCount).toBe(1); // One for combining the conditions
	});
});
