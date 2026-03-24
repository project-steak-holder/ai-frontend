import { createServerFn } from "@tanstack/react-start";
import { RawStream } from "@tanstack/react-start";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { env } from "@/env";
import { db } from "@/lib/db";
import { Conversation } from "@/lib/schema/runtime";

export const streamMessage = createServerFn({
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
			`${env.AI_SERVICE_BASE_URL}/api/v2/generate/stream`,
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${data.token}`,
				},
				body: JSON.stringify({
					conversation_id: data.conversationId,
					content: data.content,
					stream: true,
				}),
			},
		);

		if (!response.ok) {
			let errorMessage = "Failed to stream response";

			try {
				const errorBody = (await response.json()) as
					| { message?: string; error?: string }
					| undefined;

				errorMessage =
					errorBody?.message ??
					errorBody?.error ??
					`Failed to stream response (${response.status})`;
			} catch {
				errorMessage = `Failed to stream response (${response.status})`;
			}

			throw new Error(errorMessage);
		}

		if (!response.body) {
			throw new Error("No response body from AI service");
		}

		return new RawStream(response.body, { hint: "text" });
	});
