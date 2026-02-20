import { createServerFn } from "@tanstack/react-start";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { Conversation } from "@/lib/schema/runtime";

const updateConversationInput = z.object({
	id: z.uuid(),
	userId: z.uuid(),
	name: z.string().min(1).max(255),
});

export const updateConversation = createServerFn({ method: "POST" })
	.inputValidator(updateConversationInput)
	.handler(async ({ data }) => {
		const updatedConversation = await db
			.update(Conversation)
			.set({
				name: data.name,
				updatedAt: new Date(),
			})
			.where(
				and(eq(Conversation.id, data.id), eq(Conversation.userId, data.userId)),
			)
			.returning();

		const conversation = updatedConversation[0] ?? null;
		if (!conversation) {
			throw new Error("Conversation not found");
		}

		return conversation;
	});
