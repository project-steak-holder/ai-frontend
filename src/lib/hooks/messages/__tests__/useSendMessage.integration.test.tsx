import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Message } from "@/lib/schema/Message";
import { useSendMessage } from "../useSendMessage";

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

vi.mock("@/integrations/neon-auth/client", () => ({
	authClient: {
		useSession: () => ({ data: { user: { id: "user-1" } } }),
		getSession: vi.fn(),
	},
}));

const mockSendMessage = vi.fn();

vi.mock("@/server/api/messages", () => ({
	sendMessage: (...args: unknown[]) => mockSendMessage(...args),
}));

vi.mock("sonner", () => ({
	toast: {
		error: vi.fn(),
		success: vi.fn(),
	},
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

const existingMessage: Message = {
	id: "msg-existing",
	conversationId: "conv-1",
	userId: "user-1",
	content: "Existing message",
	type: "USER",
	createdAt: new Date().toISOString(),
	updatedAt: new Date().toISOString(),
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("useSendMessage", () => {
	// biome-ignore lint/suspicious/noExplicitAny: test mock reference typed loosely intentionally
	let mockToastError: ReturnType<typeof vi.mocked<(...args: any[]) => any>>;
	// biome-ignore lint/suspicious/noExplicitAny: test mock reference typed loosely intentionally
	let mockGetSession: ReturnType<typeof vi.mocked<(...args: any[]) => any>>;

	beforeEach(async () => {
		mockSendMessage.mockReset();

		// Import mocked modules to get references
		const { authClient } = await import("@/integrations/neon-auth/client");
		const { toast } = await import("sonner");

		mockGetSession = vi.mocked(authClient.getSession);
		mockToastError = vi.mocked(toast.error);

		mockGetSession.mockReset();
		mockGetSession.mockResolvedValue({
			data: { session: { token: "test-token" } },
		} as unknown as Awaited<ReturnType<typeof mockGetSession>>);

		mockToastError.mockReset();
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	it("optimistically inserts a message into the cache before server response", async () => {
		mockSendMessage.mockResolvedValue({ id: "msg-new" });

		const { queryClient, wrapper } = createWrapper();

		queryClient.setQueryData(
			["messages", "user-1", "conv-1"],
			[existingMessage],
		);

		const { result } = renderHook(() => useSendMessage(), { wrapper });

		await act(async () => {
			result.current.mutate({
				conversationId: "conv-1",
				content: "Hello",
				userId: "user-1",
			});
		});

		const cached = queryClient.getQueryData<Message[]>([
			"messages",
			"user-1",
			"conv-1",
		]);

		expect(cached).toHaveLength(2);
		expect(cached?.[1].content).toBe("Hello");
		expect(cached?.[1].id).toMatch(/^optimistic-/);
	});

	it("rolls back cache and shows toast on mutation error", async () => {
		mockSendMessage.mockRejectedValue(new Error("Server error"));

		const { queryClient, wrapper } = createWrapper();

		queryClient.setQueryData(
			["messages", "user-1", "conv-1"],
			[existingMessage],
		);

		const { result } = renderHook(() => useSendMessage(), { wrapper });

		await act(async () => {
			result.current.mutate({
				conversationId: "conv-1",
				content: "Hello",
				userId: "user-1",
			});
		});

		await waitFor(() => expect(result.current.isError).toBe(true));

		const cached = queryClient.getQueryData<Message[]>([
			"messages",
			"user-1",
			"conv-1",
		]);

		expect(cached).toHaveLength(1);
		expect(cached?.[0].id).toBe("msg-existing");
		expect(mockToastError).toHaveBeenCalledOnce();
	});

	it("throws and does not call sendMessage when unauthenticated (no token)", async () => {
		const { authClient } = await import("@/integrations/neon-auth/client");
		vi.mocked(authClient.getSession).mockResolvedValue({
			data: null,
		} as unknown as Awaited<ReturnType<typeof authClient.getSession>>);

		const { wrapper } = createWrapper();
		const { result } = renderHook(() => useSendMessage(), { wrapper });

		await act(async () => {
			result.current.mutate({
				conversationId: "conv-1",
				content: "Hello",
				userId: "user-1",
			});
		});

		await waitFor(() => expect(result.current.isError).toBe(true));

		expect(mockSendMessage).not.toHaveBeenCalled();
	});

	it("calls sendMessage with correct arguments including token", async () => {
		mockSendMessage.mockResolvedValue({ id: "msg-new" });

		const { wrapper } = createWrapper();
		const { result } = renderHook(() => useSendMessage(), { wrapper });

		await act(async () => {
			result.current.mutate({
				conversationId: "conv-1",
				content: "Test content",
				userId: "user-1",
			});
		});

		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		expect(mockSendMessage).toHaveBeenCalledWith(
			expect.objectContaining({
				data: expect.objectContaining({
					conversationId: "conv-1",
					content: "Test content",
					userId: "user-1",
					token: "test-token",
				}),
			}),
		);
	});
});
