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

const mockNavigate = vi.fn();

vi.mock("@tanstack/react-router", () => ({
	useNavigate: () => mockNavigate,
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
		mockNavigate.mockReset();
	});

	afterEach(async () => {
		vi.clearAllMocks();
		// Restore default authenticated session mock after each test
		const { authClient } = await import("@/integrations/neon-auth/client");
		vi.mocked(authClient.useSession).mockReturnValue({
			data: { user: { id: "user-1" } },
		} as ReturnType<typeof authClient.useSession>);
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

	it("shows success toast and navigates to home on deletion", async () => {
		mockDeleteConversation.mockResolvedValue({ id: "conv-1" });
		const { toast } = await import("sonner");

		const { wrapper } = createWrapper();
		const { result } = renderHook(() => useDeleteConversation(), { wrapper });

		await act(async () => {
			result.current.mutate({ id: "conv-1" });
		});

		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		expect(toast.success).toHaveBeenCalledWith("Conversation deleted");
		expect(mockNavigate).toHaveBeenCalledWith({ to: "/" });
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

		const { queryClient, wrapper } = createWrapper();
		const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

		const { result } = renderHook(() => useDeleteConversation(), { wrapper });

		await act(async () => {
			result.current.mutate({ id: "conv-1" });
		});

		// The mutation succeeds but onSuccess guards against undefined
		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		// Should still invalidate the conversations list
		expect(invalidateSpy).toHaveBeenCalledWith(
			expect.objectContaining({
				queryKey: ["conversations", "user-1"],
			}),
		);

		// Should NOT show success toast, navigate, or invalidate specific conversation when result is undefined
		expect(toast.success).not.toHaveBeenCalled();
		expect(mockNavigate).not.toHaveBeenCalled();
	});
});
