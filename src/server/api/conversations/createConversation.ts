import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { db } from "@/lib/db";
import { Conversation } from "@/lib/schema/runtime";

export const createConversation = createServerFn({ method: "POST" })
	.inputValidator(
		z.object({
			userId: z.uuid(),
			name: z.string(),
		}),
	)
	.handler(async ({ data }) => {
		const newConversation = await db
			.insert(Conversation)
			.values({
				userId: data.userId,
				name: data.name,
			})
			.returning();

		return newConversation[0];
	});
