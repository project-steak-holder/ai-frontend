import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Message } from "@/lib/schema/Message";

const mockToastError = vi.fn();

vi.mock("sonner", () => ({
	toast: {
		error: (...args: unknown[]) => mockToastError(...args),
	},
}));

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

vi.mock("@/integrations/neon-auth/client", () => ({
	authClient: {
		useSession: () => ({ data: { user: { id: "user-1" } } }),
		getSession: vi.fn(),
	},
}));

const mockStreamMessage = vi.fn();

vi.mock("@/server/api/messages/streamMessage", () => ({
	streamMessage: (...args: unknown[]) => mockStreamMessage(...args),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createWrapper() {
	const queryClient = new QueryClient({
		defaultOptions: {
			queries: { retry: false },
			mutations: { retry: false },
		},
	});
	return {
		queryClient,
		wrapper: ({ children }: { children: React.ReactNode }) => (
			<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
		),
	};
}

function createReadableStream(chunks: string[]): ReadableStream<Uint8Array> {
	const encoder = new TextEncoder();
	let index = 0;
	return new ReadableStream<Uint8Array>({
		pull(controller) {
			if (index < chunks.length) {
				controller.enqueue(encoder.encode(chunks[index]));
				index++;
			} else {
				controller.close();
			}
		},
	});
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("useStreamingResponse", () => {
	// biome-ignore lint/suspicious/noExplicitAny: test mock reference typed loosely intentionally
	let mockGetSession: ReturnType<typeof vi.mocked<(...args: any[]) => any>>;

	beforeEach(async () => {
		mockStreamMessage.mockReset();
		mockToastError.mockReset();

		const { authClient } = await import("@/integrations/neon-auth/client");
		mockGetSession = vi.mocked(authClient.getSession);
		mockGetSession.mockReset();
		mockGetSession.mockResolvedValue({
			data: { session: { token: "test-jwt-token" } },
		} as unknown as Awaited<ReturnType<typeof mockGetSession>>);
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	it("returns initial state with no streaming active", async () => {
		const { useStreamingResponse } = await import("../useStreamingResponse");
		const { wrapper } = createWrapper();

		const { result } = renderHook(() => useStreamingResponse("conv-1"), {
			wrapper,
		});

		expect(result.current.isStreaming).toBe(false);
		expect(result.current.streamedText).toBe("");
		expect(result.current.streamError).toBeNull();
		expect(result.current.sendMessage).toBeInstanceOf(Function);
	});

	it("injects optimistic user message into cache on sendMessage", async () => {
		const { useStreamingResponse } = await import("../useStreamingResponse");
		const { queryClient, wrapper } = createWrapper();

		const existingMessage: Message = {
			id: "msg-1",
			conversationId: "conv-1",
			userId: "user-1",
			content: "Existing",
			type: "USER",
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		};

		queryClient.setQueryData(
			["messages", "user-1", "conv-1"],
			[existingMessage],
		);

		// Return a stream that never completes to keep the hook busy
		mockStreamMessage.mockResolvedValue(
			createReadableStream(['data:{"content":"thinking...","partial":true}\n']),
		);

		const { result } = renderHook(() => useStreamingResponse("conv-1"), {
			wrapper,
		});

		act(() => {
			result.current.sendMessage("Hello AI");
		});

		const cached = queryClient.getQueryData<Message[]>([
			"messages",
			"user-1",
			"conv-1",
		]);

		expect(cached).toHaveLength(2);
		expect(cached?.[0].id).toBe("msg-1");
		expect(cached?.[1].content).toBe("Hello AI");
		expect(cached?.[1].type).toBe("USER");
		expect(cached?.[1].id).toMatch(/^optimistic-/);
	});

	it("sets isStreaming to true after sendMessage is called", async () => {
		const { useStreamingResponse } = await import("../useStreamingResponse");
		const { wrapper } = createWrapper();

		mockStreamMessage.mockResolvedValue(
			createReadableStream(['data:{"content":"test","partial":true}\n']),
		);

		const { result } = renderHook(() => useStreamingResponse("conv-1"), {
			wrapper,
		});

		act(() => {
			result.current.sendMessage("Hello");
		});

		expect(result.current.isStreaming).toBe(true);
	});

	it("creates optimistic message with correct fields when cache is empty", async () => {
		const { useStreamingResponse } = await import("../useStreamingResponse");
		const { queryClient, wrapper } = createWrapper();

		mockStreamMessage.mockResolvedValue(
			createReadableStream(['data:{"content":"resp","partial":true}\n']),
		);

		const { result } = renderHook(() => useStreamingResponse("conv-1"), {
			wrapper,
		});

		act(() => {
			result.current.sendMessage("New message");
		});

		const cached = queryClient.getQueryData<Message[]>([
			"messages",
			"user-1",
			"conv-1",
		]);

		expect(cached).toHaveLength(1);
		expect(cached?.[0].content).toBe("New message");
		expect(cached?.[0].conversationId).toBe("conv-1");
		expect(cached?.[0].userId).toBe("user-1");
	});

	it("increments request id on each sendMessage call", async () => {
		const { useStreamingResponse } = await import("../useStreamingResponse");
		const { wrapper, queryClient } = createWrapper();

		mockStreamMessage.mockResolvedValue(
			createReadableStream(['data:{"content":"resp","partial":true}\n']),
		);

		const { result } = renderHook(() => useStreamingResponse("conv-1"), {
			wrapper,
		});

		// First call sets isStreaming
		act(() => {
			result.current.sendMessage("First");
		});
		expect(result.current.isStreaming).toBe(true);

		// Verify two optimistic messages are added to cache with distinct calls
		act(() => {
			result.current.sendMessage("Second");
		});
		expect(result.current.isStreaming).toBe(true);

		const cached = queryClient.getQueryData<Message[]>([
			"messages",
			"user-1",
			"conv-1",
		]);
		expect(cached).toHaveLength(2);
		expect(cached?.[0].content).toBe("First");
		expect(cached?.[1].content).toBe("Second");
	});

	it("shows toast error when streaming query fails", async () => {
		const { useStreamingResponse } = await import("../useStreamingResponse");
		const { wrapper, queryClient } = createWrapper();

		mockStreamMessage.mockRejectedValue(new Error("Stream failed"));

		const { result } = renderHook(() => useStreamingResponse("conv-1"), {
			wrapper,
		});

		act(() => {
			result.current.sendMessage("Fail message");
		});

		await waitFor(() => {
			expect(result.current.isStreaming).toBe(false);
		});

		expect(mockToastError).toHaveBeenCalledWith("Error streaming response");

		// Cache is preserved (invalidateQueries triggers refetch, not removal)
		const messagesKey = ["messages", "user-1", "conv-1"];
		const cachedMessages = queryClient.getQueryData<Message[]>(messagesKey);
		expect(cachedMessages).toBeDefined();
	});

	it("resets isStreaming to false after stream error", async () => {
		const { useStreamingResponse } = await import("../useStreamingResponse");
		const { wrapper, queryClient } = createWrapper();

		mockStreamMessage.mockRejectedValue(new Error("Stream failed"));

		const { result } = renderHook(() => useStreamingResponse("conv-1"), {
			wrapper,
		});

		act(() => {
			result.current.sendMessage("Fail message");
		});

		expect(result.current.isStreaming).toBe(true);

		await waitFor(() => {
			expect(result.current.isStreaming).toBe(false);
		});

		// Cache is preserved (invalidateQueries triggers refetch, not removal)
		const messagesKey = ["messages", "user-1", "conv-1"];
		const cachedMessages = queryClient.getQueryData<Message[]>(messagesKey);
		expect(cachedMessages).toBeDefined();
	});

	it("resets isStreaming and clears streamedText after successful stream completion", async () => {
		const { useStreamingResponse } = await import("../useStreamingResponse");
		const { wrapper } = createWrapper();

		// Mock successful stream with content and completion event
		mockStreamMessage.mockResolvedValue(
			createReadableStream([
				'data:{"content":"Hello","partial":true}\n',
				'data:{"complete":true}\n',
			]),
		);

		const { result } = renderHook(() => useStreamingResponse("conv-1"), {
			wrapper,
		});

		act(() => {
			result.current.sendMessage("Test message");
		});

		expect(result.current.isStreaming).toBe(true);
		expect(result.current.streamedText).toBe("");

		// Wait for stream to complete and isStreaming to reset
		await waitFor(() => {
			expect(result.current.isStreaming).toBe(false);
		});

		expect(result.current.streamedText).toBe("");
	});

	it("invalidates messages query after successful stream completion", async () => {
		const { useStreamingResponse } = await import("../useStreamingResponse");
		const { queryClient, wrapper } = createWrapper();

		// Set initial cached messages
		const initialMessages = [
			{
				id: "msg-1",
				conversationId: "conv-1",
				userId: "user-1",
				content: "Initial message",
				type: "USER" as const,
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			},
		];
		queryClient.setQueryData(["messages", "user-1", "conv-1"], initialMessages);

		const invalidateQueriesSpy = vi.spyOn(queryClient, "invalidateQueries");

		mockStreamMessage.mockResolvedValue(
			createReadableStream([
				'data:{"content":"Response","partial":true}\n',
				'data:{"complete":true}\n',
			]),
		);

		const { result } = renderHook(() => useStreamingResponse("conv-1"), {
			wrapper,
		});

		act(() => {
			result.current.sendMessage("User message");
		});

		// Wait for stream to complete
		await waitFor(() => {
			expect(result.current.isStreaming).toBe(false);
		});

		// Verify invalidateQueries was called with the correct key
		await waitFor(() => {
			expect(invalidateQueriesSpy).toHaveBeenCalledWith({
				queryKey: ["messages", "user-1", "conv-1"],
			});
		});

		invalidateQueriesSpy.mockRestore();
	});

	it("resets isStreaming when invalidateQueries rejects after successful stream", async () => {
		const { useStreamingResponse } = await import("../useStreamingResponse");
		const { queryClient, wrapper } = createWrapper();

		// Make invalidateQueries reject to simulate a failed messages refetch
		const invalidateQueriesSpy = vi
			.spyOn(queryClient, "invalidateQueries")
			.mockRejectedValue(new Error("Refetch failed"));

		mockStreamMessage.mockResolvedValue(
			createReadableStream([
				'data:{"content":"Response","partial":true}\n',
				'data:{"complete":true}\n',
			]),
		);

		const { result } = renderHook(() => useStreamingResponse("conv-1"), {
			wrapper,
		});

		act(() => {
			result.current.sendMessage("Test message");
		});

		expect(result.current.isStreaming).toBe(true);

		// Even though invalidateQueries rejects, isStreaming must reset
		await waitFor(() => {
			expect(result.current.isStreaming).toBe(false);
		});

		expect(result.current.streamedText).toBe("");
		// Verify no error toast is shown when stream succeeds but invalidateQueries fails
		expect(mockToastError).not.toHaveBeenCalled();

		invalidateQueriesSpy.mockRestore();
	});
});
