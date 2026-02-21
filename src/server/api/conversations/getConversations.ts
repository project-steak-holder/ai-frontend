import { createServerFn } from "@tanstack/react-start";
import { asc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { Conversation } from "@/lib/schema/runtime";

export const getConversations = createServerFn({
	method: "GET",
})
	.inputValidator(
		z.object({
			userId: z.uuid(),
		}),
	)
	.handler(async ({ data }) => {
		return db
			.select()
			.from(Conversation)
			.where(eq(Conversation.userId, data.userId))
			.orderBy(asc(Conversation.createdAt));
	});
