import { createServerFn } from "@tanstack/react-start";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { env } from "@/env";
import { db } from "@/lib/db";
import { Conversation } from "@/lib/schema/runtime";

export const sendMessage = createServerFn({
	method: "POST",
})
	.inputValidator(
		z.object({
			conversationId: z.uuid(),
			userId: z.uuid(),
			content: z.string().min(1),
			token: z.string().min(1),
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

		const response = await fetch(
			`${env.VITE_AI_SERVICE_BASE_URL}/api/v1/generate`,
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${data.token}`,
				},
				body: JSON.stringify({
					conversation_id: data.conversationId,
					content: data.content,
				}),
			},
		);

		if (!response.ok) {
			let errorMessage = "Failed to send message";

			try {
				const errorBody = (await response.json()) as
					| { message?: string; error?: string }
					| undefined;

				errorMessage =
					errorBody?.message ??
					errorBody?.error ??
					`Failed to send message (${response.status})`;
			} catch {
				errorMessage = `Failed to send message (${response.status})`;
			}

			throw new Error(errorMessage);
		}

		return response.json();
	});
