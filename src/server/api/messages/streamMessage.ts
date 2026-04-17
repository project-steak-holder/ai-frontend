import { createServerFn, RawStream } from "@tanstack/react-start";
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
			content: z.string().min(1).max(5000),
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
			let errorMessage: string;

			if (response.status === 429) {
				const retryAfter = response.headers.get("Retry-After");
				const retrySuffix = retryAfter ? ` Try again in ${retryAfter}s.` : "";
				errorMessage = `Rate limit exceeded.${retrySuffix}`;
			} else {
				errorMessage = `Failed to stream response (${response.status})`;
			}

			try {
				const errorBody = (await response.json()) as
					| { message?: string; error?: string }
					| undefined;

				const bodyMessage = errorBody?.message ?? errorBody?.error;
				if (bodyMessage) {
					errorMessage = bodyMessage;
				}
			} catch {}

			const err = new Error(errorMessage) as Error & { status?: number };
			err.status = response.status;
			throw err;
		}

		if (!response.body) {
			throw new Error("No response body from AI service");
		}

		return new RawStream(response.body, { hint: "text" });
	});
