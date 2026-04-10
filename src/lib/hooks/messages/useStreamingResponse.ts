import {
	experimental_streamedQuery as streamedQuery,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import { authClient } from "@/integrations/neon-auth/client";
import type { Message } from "@/lib/schema/Message";
import { streamMessage } from "@/server/api/messages/streamMessage";

export interface SSEPartial {
	content: string;
	partial: true;
}

export interface SSEComplete {
	complete: true;
}

export interface SSEError {
	error: string;
	details?: Record<string, unknown>;
}

export type SSEEvent = SSEPartial | SSEComplete | SSEError;

export const parseSSEEvent = (dataLine: string): SSEEvent | null => {
	const trimmed = dataLine.trim();

	if (!trimmed) {
		return null;
	}

	try {
		return JSON.parse(trimmed) as SSEEvent;
	} catch {
		return null;
	}
};

export async function* parseSSEStream(
	stream: ReadableStream<Uint8Array>,
): AsyncGenerator<string> {
	const reader = stream.getReader();
	const decoder = new TextDecoder();
	let pending = "";

	try {
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

				const event = parseSSEEvent(rawData);

				if (!event) {
					continue;
				}

				if ("error" in event) {
					yield event.error;
					return;
				}

				if ("complete" in event) {
					return;
				}

				if ("partial" in event && event.content) {
					yield event.content;
				}
			}
		}
	} finally {
		reader.releaseLock();
	}
}

interface StreamRequest {
	conversationId: string;
	content: string;
	id: number;
}

export const useStreamingResponse = (conversationId: string) => {
	const { data: session } = authClient.useSession();
	const userId = session?.user?.id;
	const queryClient = useQueryClient();

	const [streamRequest, setStreamRequest] = useState<StreamRequest | null>(
		null,
	);
	const requestIdRef = useRef(0);

	const query = useQuery<string>({
		queryKey: ["streamResponse", conversationId, streamRequest?.id],
		queryFn: streamedQuery<string, string>({
			streamFn: async () => {
				if (!streamRequest) {
					throw new Error("No stream request");
				}

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

				if (!token || !userId) {
					throw new Error("You must be signed in to stream a response");
				}

				const stream = await streamMessage({
					data: {
						conversationId: streamRequest.conversationId,
						userId,
						content: streamRequest.content,
						token,
					},
				});

				if (!(stream instanceof ReadableStream)) {
					throw new Error("Expected a readable stream response");
				}

				return parseSSEStream(stream);
			},
			reducer: (acc: string, chunk: string) => acc + chunk,
			initialValue: "",
		}),
		enabled: !!streamRequest && !!userId,
	});

	const isFetching = query.fetchStatus === "fetching";

	useEffect(() => {
		if (!streamRequest || isFetching) {
			return;
		}

		if (query.isSuccess) {
			const messagesKey = ["messages", userId, conversationId];

			queryClient.invalidateQueries({ queryKey: messagesKey }).then(() => {
				setStreamRequest(null);
			});
		}

		if (query.isError) {
			setStreamRequest(null);
		}
	}, [
		isFetching,
		query.isSuccess,
		query.isError,
		streamRequest,
		queryClient,
		userId,
		conversationId,
	]);

	const sendMessage = useCallback(
		(content: string) => {
			requestIdRef.current += 1;

			const messagesKey = ["messages", userId, conversationId];
			const now = new Date().toISOString();
			const optimisticMessage: Message = {
				id: `optimistic-${Date.now()}`,
				conversationId,
				userId: userId as string,
				content,
				type: "USER",
				createdAt: now,
				updatedAt: now,
			};

			queryClient.setQueryData<Message[]>(messagesKey, (current) => {
				if (!current) {
					return [optimisticMessage];
				}

				return [...current, optimisticMessage];
			});

			setStreamRequest({
				conversationId,
				content,
				id: requestIdRef.current,
			});
		},
		[conversationId, userId, queryClient],
	);

	const isActive = !!streamRequest;

	return {
		streamMessage: sendMessage,
		streamedText: isActive ? (query.data ?? "") : "",
		isStreaming: isActive,
		streamError: query.error?.message ?? null,
	};
};
