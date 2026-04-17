import {
	experimental_streamedQuery as streamedQuery,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
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
		const parsed = JSON.parse(trimmed);
		if (
			typeof parsed === "object" &&
			parsed !== null &&
			("partial" in parsed || "complete" in parsed || "error" in parsed)
		) {
			return parsed as SSEEvent;
		}
		return null;
	} catch {
		return null;
	}
};

export async function* parseSSEStream(
	stream: ReadableStream<Uint8Array>,
	onFinish?: () => void,
): AsyncGenerator<string> {
	const reader = stream.getReader();
	const decoder = new TextDecoder();
	let pending = "";
	let accumulated = "";

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

				const isTerminal = "complete" in event && event.complete;
				const content =
					"content" in event && typeof event.content === "string"
						? event.content
						: "";

				if (content.length > 0) {
					let toYield = content;
					if (isTerminal && content.startsWith(accumulated)) {
						toYield = content.slice(accumulated.length);
					}
					if (toYield.length > 0) {
						accumulated += toYield;
						yield toYield;
					}
				}

				if (isTerminal) {
					return;
				}
			}
		}
	} finally {
		await reader.cancel().catch(() => {});
		reader.releaseLock();
		onFinish?.();
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
			streamFn: async ({ signal }) => {
				if (!streamRequest) {
					throw new Error("No stream request");
				}

				const ac = new AbortController();
				const onParentAbort = () => ac.abort();
				if (signal.aborted) {
					ac.abort();
				} else {
					signal.addEventListener("abort", onParentAbort, { once: true });
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
					ac.abort();
					signal.removeEventListener("abort", onParentAbort);
					throw new Error("You must be signed in to stream a response");
				}

				const stream = await streamMessage({
					data: {
						conversationId: streamRequest.conversationId,
						userId,
						content: streamRequest.content,
						token,
					},
					signal: ac.signal,
				});

				if (!(stream instanceof ReadableStream)) {
					ac.abort();
					signal.removeEventListener("abort", onParentAbort);
					throw new Error("Expected a readable stream response");
				}

				return parseSSEStream(stream, () => {
					ac.abort();
					signal.removeEventListener("abort", onParentAbort);
				});
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

		const messagesKey = ["messages", userId, conversationId];

		if (query.isSuccess) {
			if (query.data) {
				queryClient.setQueryData<Message[]>(messagesKey, (current) => {
					if (!current) return current;
					const now = new Date().toISOString();
					return [
						...current,
						{
							id: `optimistic-ai-${Date.now()}`,
							conversationId,
							userId: userId as string,
							content: query.data as string,
							type: "AI",
							createdAt: now,
							updatedAt: now,
						},
					];
				});
			}
			setStreamRequest(null);
			queryClient.invalidateQueries({ queryKey: messagesKey });
			return;
		}

		if (query.isError) {
			queryClient.invalidateQueries({ queryKey: messagesKey });
			const message = query.error?.message?.trim();
			toast.error(
				message && message.length > 0 ? message : "Error streaming response",
			);
		}

		setStreamRequest(null);
	}, [
		isFetching,
		query.isSuccess,
		query.isError,
		query.error,
		query.data,
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
		sendMessage,
		streamedText: isActive ? (query.data ?? "") : "",
		isStreaming: isActive,
		streamError: query.error?.message ?? null,
	};
};
