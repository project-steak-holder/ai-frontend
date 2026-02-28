import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useConversations } from "../useConversations";

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

vi.mock("@/integrations/neon-auth/client", () => ({
	authClient: {
		useSession: vi.fn().mockReturnValue({ data: { user: { id: "user-1" } } }),
	},
}));

const mockGetConversations = vi.fn();

vi.mock("@server/api/conversations", () => ({
	getConversations: (...args: unknown[]) => mockGetConversations(...args),
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

describe("useConversations", () => {
	it("returns conversations on success", async () => {
		mockGetConversations.mockResolvedValue([{ id: "c1", name: "Chat" }]);

		const { result } = renderHook(() => useConversations(), {
			wrapper: createWrapper(),
		});

		await waitFor(() => expect(result.current.isLoading).toBe(false));
		expect(result.current.conversations).toHaveLength(1);
		expect(result.current.conversations?.[0].id).toBe("c1");
	});

	it("exposes error on failure", async () => {
		mockGetConversations.mockRejectedValue(new Error("fetch failed"));

		const { result } = renderHook(() => useConversations(), {
			wrapper: createWrapper(),
		});

		await waitFor(() => expect(result.current.error).toBeTruthy());
		expect(result.current.conversations).toBeUndefined();
	});

	it("returns isLoading true initially", () => {
		mockGetConversations.mockReturnValue(new Promise(() => {})); // never resolves

		const { result } = renderHook(() => useConversations(), {
			wrapper: createWrapper(),
		});

		expect(result.current.isLoading).toBe(true);
	});
});
