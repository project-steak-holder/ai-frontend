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
		const { eq } = await import("drizzle-orm");

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

		// Verify the where clause uses both id and userId predicates
		expect(dbMock.where).toHaveBeenCalled();
		expect(andCallCount).toBe(1);

		// Verify the actual column/value pairs passed to eq()
		const eqMock = vi.mocked(eq);
		expect(eqMock).toHaveBeenCalledWith("id", VALID_CONVERSATION_ID);
		expect(eqMock).toHaveBeenCalledWith("user_id", VALID_USER_ID);
	});
});
