import { createServerFn } from "@tanstack/react-start";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { Conversation } from "@/lib/schema/runtime";

export const deleteConversation = createServerFn({ method: "POST" })
	.inputValidator(
		z.object({
			userId: z.uuid(),
			id: z.uuid(),
		}),
	)
	.handler(async ({ data }) => {
		const deletedConversation = await db
			.delete(Conversation)
			.where(
				and(eq(Conversation.id, data.id), eq(Conversation.userId, data.userId)),
			)
			.returning();

		return deletedConversation[0];
	});
