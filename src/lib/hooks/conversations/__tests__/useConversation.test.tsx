import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useConversation } from "../useConversation";

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

vi.mock("@/integrations/neon-auth/client", () => ({
	authClient: {
		useSession: vi.fn().mockReturnValue({ data: { user: { id: "user-1" } } }),
	},
}));

const mockGetConversationById = vi.fn();

vi.mock("@server/api/conversations", () => ({
	getConversationById: (...args: unknown[]) =>
		mockGetConversationById(...args),
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

describe("useConversation", () => {
	it("returns a conversation on success", async () => {
		mockGetConversationById.mockResolvedValue({
			id: "conv-1",
			name: "Test Chat",
		});

		const { result } = renderHook(
			() => useConversation("conv-1"),
			{ wrapper: createWrapper() },
		);

		await waitFor(() => expect(result.current.isLoading).toBe(false));
		expect(result.current.conversation?.id).toBe("conv-1");
		expect(result.current.error).toBeNull();
	});

	it("exposes error when fetch fails", async () => {
		mockGetConversationById.mockRejectedValue(
			new Error("Conversation not found"),
		);

		const { result } = renderHook(
			() => useConversation("conv-missing"),
			{ wrapper: createWrapper() },
		);

		await waitFor(() => expect(result.current.error).toBeTruthy());
		expect(result.current.conversation).toBeUndefined();
	});

	it("returns isLoading true while fetching", () => {
		mockGetConversationById.mockReturnValue(new Promise(() => {})); // never resolves

		const { result } = renderHook(
			() => useConversation("conv-1"),
			{ wrapper: createWrapper() },
		);

		expect(result.current.isLoading).toBe(true);
	});
});
