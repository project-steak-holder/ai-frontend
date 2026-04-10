import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useUpdateConversation } from "../useUpdateConversation";

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

vi.mock("@/integrations/neon-auth/client", () => ({
	authClient: {
		useSession: vi.fn().mockReturnValue({ data: { user: { id: "user-1" } } }),
	},
}));

const mockUpdateConversation = vi.fn();

vi.mock("@server/api/conversations", () => ({
	updateConversation: (...args: unknown[]) => mockUpdateConversation(...args),
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

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("useUpdateConversation", () => {
	beforeEach(() => {
		mockUpdateConversation.mockReset();
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	it("calls updateConversation with correct arguments", async () => {
		mockUpdateConversation.mockResolvedValue({ id: "conv-1" });

		const { wrapper } = createWrapper();
		const { result } = renderHook(() => useUpdateConversation(), { wrapper });

		await act(async () => {
			result.current.mutate({ id: "conv-1", name: "Updated Name" });
		});

		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		expect(mockUpdateConversation).toHaveBeenCalledWith(
			expect.objectContaining({
				data: expect.objectContaining({
					id: "conv-1",
					userId: "user-1",
					name: "Updated Name",
				}),
			}),
		);
	});

	it("invalidates conversation queries on success", async () => {
		mockUpdateConversation.mockResolvedValue({ id: "conv-1" });

		const { queryClient, wrapper } = createWrapper();
		const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

		const { result } = renderHook(() => useUpdateConversation(), { wrapper });

		await act(async () => {
			result.current.mutate({ id: "conv-1", name: "Updated Name" });
		});

		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		expect(invalidateSpy).toHaveBeenCalledWith(
			expect.objectContaining({
				queryKey: ["conversations", "user-1"],
			}),
		);
		expect(invalidateSpy).toHaveBeenCalledWith(
			expect.objectContaining({
				queryKey: ["conversation", "conv-1", "user-1"],
			}),
		);
	});

	it("reports error when mutation fails", async () => {
		mockUpdateConversation.mockRejectedValue(
			new Error("Failed to update conversation"),
		);

		const { wrapper } = createWrapper();
		const { result } = renderHook(() => useUpdateConversation(), { wrapper });

		await act(async () => {
			result.current.mutate({ id: "conv-1", name: "Updated Name" });
		});

		await waitFor(() => expect(result.current.isError).toBe(true));

		expect(result.current.error?.message).toBe("Failed to update conversation");
	});

	it("throws when user is not authenticated", async () => {
		const { authClient } = await import("@/integrations/neon-auth/client");
		vi.mocked(authClient.useSession).mockReturnValue({
			data: null,
		} as ReturnType<typeof authClient.useSession>);

		const { wrapper } = createWrapper();
		const { result } = renderHook(() => useUpdateConversation(), { wrapper });

		await act(async () => {
			result.current.mutate({ id: "conv-1", name: "Updated Name" });
		});

		await waitFor(() => expect(result.current.isError).toBe(true));

		expect(mockUpdateConversation).not.toHaveBeenCalled();
	});
});
