import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useCreateConversation } from "../useCreateConversation";

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

vi.mock("@/integrations/neon-auth/client", () => ({
	authClient: {
		useSession: vi.fn().mockReturnValue({ data: { user: { id: "user-1" } } }),
	},
}));

const mockCreateConversation = vi.fn();

vi.mock("@server/api/conversations", () => ({
	createConversation: (...args: unknown[]) => mockCreateConversation(...args),
}));

const mockNavigate = vi.fn();

vi.mock("@tanstack/react-router", () => ({
	useNavigate: () => mockNavigate,
}));

vi.mock("sonner", () => ({
	toast: {
		success: vi.fn(),
		error: vi.fn(),
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

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("useCreateConversation", () => {
	beforeEach(() => {
		mockCreateConversation.mockReset();
		mockNavigate.mockReset();
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	it("calls createConversation with correct arguments", async () => {
		mockCreateConversation.mockResolvedValue({ id: "conv-new" });

		const { wrapper } = createWrapper();
		const { result } = renderHook(() => useCreateConversation(), { wrapper });

		await act(async () => {
			result.current.mutate({ name: "New Chat" });
		});

		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		expect(mockCreateConversation).toHaveBeenCalledWith(
			expect.objectContaining({
				data: expect.objectContaining({
					userId: "user-1",
					name: "New Chat",
				}),
			}),
		);
	});

	it("navigates to new conversation on success", async () => {
		mockCreateConversation.mockResolvedValue({ id: "conv-new" });

		const { wrapper } = createWrapper();
		const { result } = renderHook(() => useCreateConversation(), { wrapper });

		await act(async () => {
			result.current.mutate({ name: "New Chat" });
		});

		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		expect(mockNavigate).toHaveBeenCalledWith({ to: "/chat/conv-new" });
	});

	it("shows success toast on creation", async () => {
		mockCreateConversation.mockResolvedValue({ id: "conv-new" });
		const { toast } = await import("sonner");

		const { wrapper } = createWrapper();
		const { result } = renderHook(() => useCreateConversation(), { wrapper });

		await act(async () => {
			result.current.mutate({ name: "New Chat" });
		});

		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		expect(toast.success).toHaveBeenCalledWith(
			"Conversation created successfully",
		);
	});

	it("shows error toast when creation fails", async () => {
		mockCreateConversation.mockRejectedValue(
			new Error("Failed to create conversation"),
		);
		const { toast } = await import("sonner");

		const { wrapper } = createWrapper();
		const { result } = renderHook(() => useCreateConversation(), { wrapper });

		await act(async () => {
			result.current.mutate({ name: "New Chat" });
		});

		await waitFor(() => expect(result.current.isError).toBe(true));

		expect(toast.error).toHaveBeenCalledWith("Failed to create conversation");
	});

	it("shows generic error toast for non-Error rejections", async () => {
		mockCreateConversation.mockRejectedValue("string error");
		const { toast } = await import("sonner");

		const { wrapper } = createWrapper();
		const { result } = renderHook(() => useCreateConversation(), { wrapper });

		await act(async () => {
			result.current.mutate({ name: "New Chat" });
		});

		await waitFor(() => expect(result.current.isError).toBe(true));

		expect(toast.error).toHaveBeenCalledWith(
			"An error occurred while creating the conversation",
		);
	});

	it("throws when user is not authenticated", async () => {
		const { authClient } = await import("@/integrations/neon-auth/client");
		vi.mocked(authClient.useSession).mockReturnValue({
			data: null,
		} as ReturnType<typeof authClient.useSession>);

		const { wrapper } = createWrapper();
		const { result } = renderHook(() => useCreateConversation(), { wrapper });

		await act(async () => {
			result.current.mutate({ name: "New Chat" });
		});

		await waitFor(() => expect(result.current.isError).toBe(true));

		expect(mockCreateConversation).not.toHaveBeenCalled();
	});
});
