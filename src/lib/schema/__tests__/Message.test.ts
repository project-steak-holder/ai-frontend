import { assertType, describe, expectTypeOf, it } from "vitest";
import type { Message, NewMessage, UpdateMessage } from "../Message";

describe("Message Types", () => {
	it("should have correct Message type structure", () => {
		expectTypeOf<Message>().toHaveProperty("id");
		expectTypeOf<Message>().toHaveProperty("conversationId");
		expectTypeOf<Message>().toHaveProperty("userId");
		expectTypeOf<Message>().toHaveProperty("content");
		expectTypeOf<Message>().toHaveProperty("type");
		expectTypeOf<Message>().toHaveProperty("createdAt");
		expectTypeOf<Message>().toHaveProperty("updatedAt");
	});

	it("should have correct field types", () => {
		expectTypeOf<Message["id"]>().toBeString();
		expectTypeOf<Message["conversationId"]>().toBeString();
		expectTypeOf<Message["userId"]>().toBeString();
		expectTypeOf<Message["content"]>().toBeString();
		expectTypeOf<Message["createdAt"]>().not.toBeNullable();
		expectTypeOf<Message["updatedAt"]>().not.toBeNullable();
	});

	it("should have enum type field", () => {
		expectTypeOf<Message["type"]>().toEqualTypeOf<"USER" | "AI">();
	});

	it("should allow creating a NewMessage", () => {
		const msg: NewMessage = {
			id: "msg-1",
			conversationId: "conv-1",
			userId: "user-1",
			content: "hello",
			type: "USER",
			createdAt: "2026-01-01T00:00:00Z",
			updatedAt: "2026-01-01T00:00:00Z",
		};
		assertType<NewMessage>(msg);
		expectTypeOf(msg).toEqualTypeOf<NewMessage>();
	});

	it("UpdateMessage should have all fields optional", () => {
		const update: UpdateMessage = {};
		assertType<UpdateMessage>(update);

		const withContent: UpdateMessage = { content: "updated" };
		assertType<UpdateMessage>(withContent);

		const withType: UpdateMessage = { type: "AI" };
		assertType<UpdateMessage>(withType);

		const withMultiple: UpdateMessage = { content: "updated", type: "USER" };
		assertType<UpdateMessage>(withMultiple);
	});
});
