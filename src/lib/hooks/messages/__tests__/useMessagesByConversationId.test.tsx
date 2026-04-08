import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useMessagesByConversationId } from "../useMessagesByConversationId";

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

vi.mock("@/integrations/neon-auth/client", () => ({
	authClient: {
		useSession: vi.fn().mockReturnValue({ data: { user: { id: "user-1" } } }),
	},
}));

const mockGetMessages = vi.fn();

vi.mock("@/server/api/messages", () => ({
	getMessagesByConversationId: (...args: unknown[]) => mockGetMessages(...args),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createWrapper() {
	const queryClient = new QueryClient({
		defaultOptions: { queries: { retry: false } },
	});
	return ({ children }: { children: React.ReactNode }) => (
		<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
	);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("useMessagesByConversationId", () => {
	it("returns messages on success", async () => {
		const messages = [
			{ id: "msg-1", content: "Hello", conversationId: "conv-1" },
			{ id: "msg-2", content: "World", conversationId: "conv-1" },
		];
		mockGetMessages.mockResolvedValue(messages);

		const { result } = renderHook(() => useMessagesByConversationId("conv-1"), {
			wrapper: createWrapper(),
		});

		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		expect(result.current.data).toEqual(messages);
	});

	it("exposes error when fetch fails", async () => {
		mockGetMessages.mockRejectedValue(new Error("Failed to fetch messages"));

		const { result } = renderHook(() => useMessagesByConversationId("conv-1"), {
			wrapper: createWrapper(),
		});

		await waitFor(() => expect(result.current.isError).toBe(true));

		expect(result.current.error?.message).toBe("Failed to fetch messages");
	});

	it("does not fetch when conversationId is empty", () => {
		mockGetMessages.mockReset();

		const { result } = renderHook(() => useMessagesByConversationId(""), {
			wrapper: createWrapper(),
		});

		expect(result.current.fetchStatus).toBe("idle");
	});

	it("passes correct data to the server function", async () => {
		mockGetMessages.mockResolvedValue([]);

		const { result } = renderHook(() => useMessagesByConversationId("conv-1"), {
			wrapper: createWrapper(),
		});

		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		expect(mockGetMessages).toHaveBeenCalledWith(
			expect.objectContaining({
				data: { conversationId: "conv-1", userId: "user-1" },
			}),
		);
	});
});
