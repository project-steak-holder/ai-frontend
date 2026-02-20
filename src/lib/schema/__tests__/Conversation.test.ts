import { assertType, describe, expectTypeOf, it } from "vitest";
import type {
	Conversation,
	NewConversation,
	UpdateConversation,
} from "../Conversation";

describe("Conversation Types", () => {
	it("should have correct Conversation type structure", () => {
		expectTypeOf<Conversation>().toHaveProperty("id");
		expectTypeOf<Conversation>().toHaveProperty("userId");
		expectTypeOf<Conversation>().toHaveProperty("name");
		expectTypeOf<Conversation>().toHaveProperty("createdAt");
		expectTypeOf<Conversation>().toHaveProperty("updatedAt");
	});

	it("should have correct field types", () => {
		expectTypeOf<Conversation["id"]>().toBeString();
		expectTypeOf<Conversation["userId"]>().toBeString();
		expectTypeOf<Conversation["name"]>().toBeString();
		expectTypeOf<Conversation["createdAt"]>().not.toBeNullable();
		expectTypeOf<Conversation["updatedAt"]>().not.toBeNullable();
	});

	it("should allow creating new conversation without id and timestamps", () => {
		const newConv: NewConversation = {
			userId: "test-user-id",
			name: "Test Conversation",
		};

		assertType<NewConversation>(newConv);
		expectTypeOf(newConv).toEqualTypeOf<NewConversation>();
	});

	it("NewConversation should require userId and name", () => {
		// @ts-expect-error - userId is required
		const missingUserId: NewConversation = { name: "Test" };

		// @ts-expect-error - name is required
		const missingName: NewConversation = { userId: "test-id" };

		assertType<typeof missingUserId>(missingUserId);
		assertType<typeof missingName>(missingName);
	});

	it("UpdateConversation should have all fields optional", () => {
		const update: UpdateConversation = {};
		assertType<UpdateConversation>(update);

		const updateWithName: UpdateConversation = { name: "Updated Name" };
		assertType<UpdateConversation>(updateWithName);

		const updateWithUserId: UpdateConversation = { userId: "new-user-id" };
		assertType<UpdateConversation>(updateWithUserId);

		const updateAll: UpdateConversation = {
			userId: "new-user-id",
			name: "New Name",
		};
		assertType<UpdateConversation>(updateAll);
	});
});
