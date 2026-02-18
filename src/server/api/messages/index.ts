import { createServerFn } from "@tanstack/react-start";
import { and, asc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { Conversation, Message } from "@/lib/schema/runtime";

export const getMessagesByConversationId = createServerFn({
	method: "GET",
})
	.inputValidator(
		z.object({
			conversationId: z.uuid(),
			userId: z.uuid(),
		}),
	)
	.handler(async ({ data }) => {
		const conversation = await db
			.select({ id: Conversation.id })
			.from(Conversation)
			.where(
				and(
					eq(Conversation.id, data.conversationId),
					eq(Conversation.userId, data.userId),
				),
			)
			.limit(1);

		if (conversation.length === 0) {
			throw new Error("Conversation not found");
		}

		return await db
			.select()
			.from(Message)
			.where(
				and(
					eq(Message.conversationId, data.conversationId),
					eq(Message.userId, data.userId),
				),
			)
			.orderBy(asc(Message.createdAt));
	});
