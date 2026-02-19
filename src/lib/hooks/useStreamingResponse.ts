import { useCallback, useState } from "react";
import { env } from "@/env";
import { authClient } from "@/integrations/neon-auth/client";

interface StreamMessageInput {
	conversationId: string;
	content: string;
	onChunk?: (chunk: string) => void;
}

const toChunkText = (dataLine: string) => {
	const trimmed = dataLine.trim();

	if (!trimmed || trimmed === "[DONE]") {
		return "";
	}

	try {
		const parsed = JSON.parse(trimmed) as
			| {
					content?: string;
					text?: string;
					delta?: string;
					token?: string;
					message?: { content?: string };
			  }
			| string;

		if (typeof parsed === "string") {
			return parsed;
		}

		return (
			parsed.delta ??
			parsed.token ??
			parsed.content ??
			parsed.text ??
			parsed.message?.content ??
			""
		);
	} catch {
		return trimmed;
	}
};

export const useStreamingResponse = () => {
	const [streamedText, setStreamedText] = useState("");
	const [isStreaming, setIsStreaming] = useState(false);
	const [streamError, setStreamError] = useState<string | null>(null);

	const streamMessage = useCallback(
		async ({ conversationId, content, onChunk }: StreamMessageInput) => {
			setIsStreaming(true);
			setStreamError(null);
			setStreamedText("");

			let token: string | null = null;

			const { data } = await authClient.getSession({
				fetchOptions: {
					onSuccess: (ctx) => {
						token = ctx.response.headers.get("set-auth-jwt");
					},
				},
			});

			if (!token && typeof data?.session?.token === "string") {
				token = data.session.token;
			}

			if (!token) {
				const error = "You must be signed in to stream a response";
				setStreamError(error);
				setIsStreaming(false);
				throw new Error(error);
			}

			const response = await fetch(
				`${env.VITE_AI_SERVICE_BASE_URL}/api/v1/generate`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${token}`,
					},
					body: JSON.stringify({
						conversation_id: conversationId,
						content,
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

				setStreamError(errorMessage);
				setIsStreaming(false);
				throw new Error(errorMessage);
			}

			if (!response.body) {
				setIsStreaming(false);
				return "";
			}

			const reader = response.body.getReader();
			const decoder = new TextDecoder();
			let pending = "";
			let completeText = "";

			while (true) {
				const { value, done } = await reader.read();

				if (done) {
					break;
				}

				pending += decoder.decode(value, { stream: true });
				const lines = pending.split("\n");
				pending = lines.pop() ?? "";

				for (const line of lines) {
					const normalized = line.trim();

					if (!normalized) {
						continue;
					}

					const rawData = normalized.startsWith("data:")
						? normalized.slice(5)
						: normalized;

					const chunk = toChunkText(rawData);

					if (!chunk) {
						continue;
					}

					setStreamedText((current) => {
						const next = current + chunk;
						onChunk?.(chunk);
						return next;
					});
					completeText += chunk;
				}
			}

			setIsStreaming(false);

			return completeText;
		},
		[],
	);

	return {
		streamMessage,
		streamedText,
		isStreaming,
		streamError,
	};
};
