import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
	act,
	cleanup,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useDialogStore } from "@/stores/dialogStore";
import { ConversationDialog } from "../ConversationDialog";

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

vi.mock("@/integrations/neon-auth/client", () => ({
	authClient: {
		useSession: () => ({ data: { user: { id: "user-1" } } }),
	},
}));

const mockCreateMutateAsync = vi.fn();
const mockUpdateMutateAsync = vi.fn();

vi.mock("@/lib/hooks/conversations", () => ({
	useCreateConversation: () => ({
		mutateAsync: mockCreateMutateAsync,
	}),
	useUpdateConversation: () => ({
		mutateAsync: mockUpdateMutateAsync,
	}),
}));

vi.mock("sonner", () => ({
	toast: {
		success: vi.fn(),
		error: vi.fn(),
	},
}));

// ---------------------------------------------------------------------------
// Polyfill PointerEvent for Radix UI dialogs in jsdom
// ---------------------------------------------------------------------------

if (typeof window.PointerEvent === "undefined") {
	class PointerEvent extends MouseEvent {}
	// @ts-expect-error - Polyfilling PointerEvent for jsdom
	window.PointerEvent = PointerEvent;
}

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
	return ({ children }: { children: React.ReactNode }) => (
		<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
	);
}

function openCreateDialog() {
	act(() => {
		useDialogStore.getState().openDialog({ type: "conversation" });
	});
}

function openRenameDialog(id: string, name: string) {
	act(() => {
		useDialogStore.getState().openDialog({ type: "conversation", id, name });
	});
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("ConversationDialog", () => {
	beforeEach(() => {
		mockCreateMutateAsync.mockReset();
		mockUpdateMutateAsync.mockReset();
		useDialogStore.getState().closeDialog();
	});

	afterEach(() => {
		cleanup();
	});

	it("does not render dialog content when store is closed", () => {
		render(<ConversationDialog />, { wrapper: createWrapper() });

		expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
	});

	it("opens dialog when store is set to conversation type", async () => {
		render(<ConversationDialog />, { wrapper: createWrapper() });

		openCreateDialog();

		await waitFor(() => {
			expect(screen.getByRole("dialog")).toBeInTheDocument();
		});
	});

	it("shows input placeholder when dialog is open", async () => {
		render(<ConversationDialog />, { wrapper: createWrapper() });

		openCreateDialog();

		await waitFor(() => {
			expect(
				screen.getByPlaceholderText(/requirements elicitation/i),
			).toBeInTheDocument();
		});

		// Verify input is accessible by role and accessible name (WCAG 1.3.1)
		expect(
			screen.getByRole("textbox", { name: /conversation name/i }),
		).toBeInTheDocument();
	});

	it("Create button is disabled when title input is empty", async () => {
		render(<ConversationDialog />, { wrapper: createWrapper() });

		openCreateDialog();

		await waitFor(() => {
			expect(screen.getByRole("button", { name: /^create$/i })).toBeDisabled();
		});
	});

	it("Create button is enabled when title has content", async () => {
		render(<ConversationDialog />, { wrapper: createWrapper() });

		openCreateDialog();

		await waitFor(() => {
			expect(screen.getByRole("dialog")).toBeInTheDocument();
		});

		const input = screen.getByPlaceholderText(/requirements elicitation/i);
		await act(async () => {
			fireEvent.change(input, { target: { value: "My Conversation" } });
		});

		expect(screen.getByRole("button", { name: /^create$/i })).toBeEnabled();
	});

	it("calls createConversation mutateAsync with trimmed title on Create click", async () => {
		mockCreateMutateAsync.mockResolvedValue({
			id: "conv-1",
			name: "My Conversation",
		});

		render(<ConversationDialog />, { wrapper: createWrapper() });

		openCreateDialog();

		await waitFor(() => {
			expect(screen.getByRole("dialog")).toBeInTheDocument();
		});

		const input = screen.getByPlaceholderText(/requirements elicitation/i);
		await act(async () => {
			fireEvent.change(input, { target: { value: "  My Conversation  " } });
		});

		await act(async () => {
			fireEvent.click(screen.getByRole("button", { name: /^create$/i }));
		});

		await waitFor(() => {
			expect(mockCreateMutateAsync).toHaveBeenCalledWith({
				name: "My Conversation",
			});
		});
	});

	it("closes dialog after successful creation", async () => {
		mockCreateMutateAsync.mockResolvedValue({
			id: "conv-42",
			name: "Success Conv",
		});

		render(<ConversationDialog />, { wrapper: createWrapper() });

		openCreateDialog();

		await waitFor(() => {
			expect(screen.getByRole("dialog")).toBeInTheDocument();
		});

		const input = screen.getByPlaceholderText(/requirements elicitation/i);
		await act(async () => {
			fireEvent.change(input, { target: { value: "Success Conv" } });
		});

		await act(async () => {
			fireEvent.click(screen.getByRole("button", { name: /^create$/i }));
		});

		await waitFor(() => {
			expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
		});
	});

	it("Cancel button closes dialog without calling createConversation", async () => {
		render(<ConversationDialog />, { wrapper: createWrapper() });

		openCreateDialog();

		await waitFor(() => {
			expect(screen.getByRole("dialog")).toBeInTheDocument();
		});

		await act(async () => {
			fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
		});

		await waitFor(() => {
			expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
		});

		expect(mockCreateMutateAsync).not.toHaveBeenCalled();
	});

	it("Enter key submits the form and calls createConversation", async () => {
		mockCreateMutateAsync.mockResolvedValue({
			id: "conv-99",
			name: "Enter Conv",
		});

		render(<ConversationDialog />, { wrapper: createWrapper() });

		openCreateDialog();

		await waitFor(() => {
			expect(screen.getByRole("dialog")).toBeInTheDocument();
		});

		const input = screen.getByPlaceholderText(/requirements elicitation/i);
		await act(async () => {
			fireEvent.change(input, { target: { value: "Enter Conv" } });
		});

		await act(async () => {
			fireEvent.keyDown(input, { key: "Enter", code: "Enter" });
		});

		await waitFor(() => {
			expect(mockCreateMutateAsync).toHaveBeenCalledWith({
				name: "Enter Conv",
			});
		});
	});

	it("shows Rename button and calls updateConversation when conversationId is present", async () => {
		mockUpdateMutateAsync.mockResolvedValue({
			id: "conv-1",
			name: "Renamed",
		});

		render(<ConversationDialog />, { wrapper: createWrapper() });

		openRenameDialog("conv-1", "Old Name");

		await waitFor(() => {
			expect(screen.getByRole("dialog")).toBeInTheDocument();
		});

		const input = screen.getByPlaceholderText(/requirements elicitation/i);
		expect(input).toHaveValue("Old Name");

		await act(async () => {
			fireEvent.change(input, { target: { value: "Renamed" } });
		});

		await act(async () => {
			fireEvent.click(screen.getByRole("button", { name: /^rename$/i }));
		});

		await waitFor(() => {
			expect(mockUpdateMutateAsync).toHaveBeenCalledWith({
				id: "conv-1",
				name: "Renamed",
			});
		});

		// Verify dialog closes after successful rename
		await waitFor(() => {
			expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
		});
	});

	it("handles createConversation rejection silently without closing dialog", async () => {
		const error = new Error("Failed to create conversation");
		mockCreateMutateAsync.mockRejectedValue(error);

		render(<ConversationDialog />, { wrapper: createWrapper() });

		openCreateDialog();

		await waitFor(() => {
			expect(screen.getByRole("dialog")).toBeInTheDocument();
		});

		const input = screen.getByPlaceholderText(/requirements elicitation/i);
		await act(async () => {
			fireEvent.change(input, { target: { value: "Failed Conversation" } });
		});

		await act(async () => {
			fireEvent.click(screen.getByRole("button", { name: /^create$/i }));
		});

		await waitFor(() => {
			expect(mockCreateMutateAsync).toHaveBeenCalledWith({
				name: "Failed Conversation",
			});
		});

		// Dialog should still be open after the rejection
		expect(screen.getByRole("dialog")).toBeInTheDocument();
	});

	it("handles updateConversation rejection silently without closing dialog", async () => {
		const error = new Error("Failed to update conversation");
		mockUpdateMutateAsync.mockRejectedValue(error);

		render(<ConversationDialog />, { wrapper: createWrapper() });

		openRenameDialog("conv-1", "Old Name");

		await waitFor(() => {
			expect(screen.getByRole("dialog")).toBeInTheDocument();
		});

		const input = screen.getByPlaceholderText(/requirements elicitation/i);
		await act(async () => {
			fireEvent.change(input, { target: { value: "New Name" } });
		});

		await act(async () => {
			fireEvent.click(screen.getByRole("button", { name: /^rename$/i }));
		});

		await waitFor(() => {
			expect(mockUpdateMutateAsync).toHaveBeenCalledWith({
				id: "conv-1",
				name: "New Name",
			});
		});

		// Dialog should still be open after the rejection
		expect(screen.getByRole("dialog")).toBeInTheDocument();
	});
});
