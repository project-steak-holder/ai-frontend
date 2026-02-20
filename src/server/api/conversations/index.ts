import { createServerFn } from "@tanstack/react-start";
import { and, asc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { Conversation } from "@/lib/schema/runtime";

export const getConversations = createServerFn({
	method: "GET",
})
	.inputValidator(z.uuid())
	.handler(async ({ data: userId }) => {
		return db
			.select()
			.from(Conversation)
			.where(eq(Conversation.userId, userId))
			.orderBy(asc(Conversation.createdAt));
	});

export const getConversationById = createServerFn({
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
			.select()
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

		return conversation;
	});
