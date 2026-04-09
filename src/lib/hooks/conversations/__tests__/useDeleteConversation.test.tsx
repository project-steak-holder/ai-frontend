import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useDeleteConversation } from "../useDeleteConversation";

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

vi.mock("@/integrations/neon-auth/client", () => ({
	authClient: {
		useSession: vi.fn().mockReturnValue({ data: { user: { id: "user-1" } } }),
	},
}));

const mockDeleteConversation = vi.fn();

vi.mock("@server/api/conversations", () => ({
	deleteConversation: (...args: unknown[]) => mockDeleteConversation(...args),
}));

vi.mock("sonner", () => ({
	toast: { error: vi.fn(), success: vi.fn() },
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

describe("useDeleteConversation", () => {
	beforeEach(() => {
		mockDeleteConversation.mockReset();
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	it("calls deleteConversation with correct arguments", async () => {
		mockDeleteConversation.mockResolvedValue({ id: "conv-1" });

		const { wrapper } = createWrapper();
		const { result } = renderHook(() => useDeleteConversation(), { wrapper });

		await act(async () => {
			result.current.mutate({ id: "conv-1" });
		});

		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		expect(mockDeleteConversation).toHaveBeenCalledWith(
			expect.objectContaining({
				data: expect.objectContaining({
					id: "conv-1",
					userId: "user-1",
				}),
			}),
		);
	});

	it("invalidates conversation queries on success", async () => {
		mockDeleteConversation.mockResolvedValue({ id: "conv-1" });

		const { queryClient, wrapper } = createWrapper();
		const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

		const { result } = renderHook(() => useDeleteConversation(), { wrapper });

		await act(async () => {
			result.current.mutate({ id: "conv-1" });
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

	it("shows success toast on deletion", async () => {
		mockDeleteConversation.mockResolvedValue({ id: "conv-1" });
		const { toast } = await import("sonner");

		const { wrapper } = createWrapper();
		const { result } = renderHook(() => useDeleteConversation(), { wrapper });

		await act(async () => {
			result.current.mutate({ id: "conv-1" });
		});

		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		expect(toast.success).toHaveBeenCalledWith("Conversation deleted");
	});

	it("shows error toast when mutation fails", async () => {
		mockDeleteConversation.mockRejectedValue(
			new Error("Failed to delete conversation"),
		);
		const { toast } = await import("sonner");

		const { wrapper } = createWrapper();
		const { result } = renderHook(() => useDeleteConversation(), { wrapper });

		await act(async () => {
			result.current.mutate({ id: "conv-1" });
		});

		await waitFor(() => expect(result.current.isError).toBe(true));

		expect(toast.error).toHaveBeenCalledWith("Error deleting conversation");
	});

	it("reports error when mutation fails", async () => {
		mockDeleteConversation.mockRejectedValue(
			new Error("Failed to delete conversation"),
		);

		const { wrapper } = createWrapper();
		const { result } = renderHook(() => useDeleteConversation(), { wrapper });

		await act(async () => {
			result.current.mutate({ id: "conv-1" });
		});

		await waitFor(() => expect(result.current.isError).toBe(true));

		expect(result.current.error?.message).toBe("Failed to delete conversation");
	});

	it("throws when user is not authenticated", async () => {
		const { authClient } = await import("@/integrations/neon-auth/client");
		vi.mocked(authClient.useSession).mockReturnValue({
			data: null,
		} as ReturnType<typeof authClient.useSession>);

		const { wrapper } = createWrapper();
		const { result } = renderHook(() => useDeleteConversation(), { wrapper });

		await act(async () => {
			result.current.mutate({ id: "conv-1" });
		});

		await waitFor(() => expect(result.current.isError).toBe(true));

		expect(mockDeleteConversation).not.toHaveBeenCalled();
	});

	it("handles undefined response from deleteConversation (conversation not found)", async () => {
		mockDeleteConversation.mockResolvedValue(undefined);
		const { toast } = await import("sonner");

		const { wrapper } = createWrapper();
		const { result } = renderHook(() => useDeleteConversation(), { wrapper });

		await act(async () => {
			result.current.mutate({ id: "conv-1" });
		});

		// The mutation will error because the onSuccess callback tries to destructure undefined
		await waitFor(() => expect(result.current.isError).toBe(true));

		// Should report an error (destructuring undefined)
		expect(result.current.error).toBeDefined();
	});
});
