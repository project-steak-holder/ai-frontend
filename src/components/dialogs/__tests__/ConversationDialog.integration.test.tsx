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
import { CreateConversationDialog } from "../ConversationDialog";

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

const mockNavigate = vi.fn();

vi.mock("@tanstack/react-router", () => ({
	useNavigate: () => mockNavigate,
}));

vi.mock("@/integrations/neon-auth/client", () => ({
	authClient: {
		useSession: () => ({ data: { user: { id: "user-1" } } }),
	},
}));

const mockCreateConversation = vi.fn();

vi.mock("@server/api/conversations", () => ({
	createConversation: (...args: unknown[]) => mockCreateConversation(...args),
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

async function openDialog() {
	const trigger = screen.getByRole("button", { name: /new conversation/i });
	await act(async () => {
		fireEvent.click(trigger);
	});
	await waitFor(() => {
		expect(screen.getByRole("dialog")).toBeInTheDocument();
	});
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("CreateConversationDialog", () => {
	beforeEach(() => {
		mockCreateConversation.mockReset();
		mockNavigate.mockReset();
	});

	afterEach(() => {
		cleanup();
	});

	it("renders the 'New Conversation' trigger button", () => {
		render(<CreateConversationDialog />, { wrapper: createWrapper() });

		expect(
			screen.getByRole("button", { name: /new conversation/i }),
		).toBeInTheDocument();
	});

	it("opens dialog when button is clicked (dialog role + input placeholder visible)", async () => {
		render(<CreateConversationDialog />, { wrapper: createWrapper() });

		await openDialog();

		expect(
			screen.getByPlaceholderText(/requirements elicitation/i),
		).toBeInTheDocument();
	});

	it("Create button is disabled when title input is empty", async () => {
		render(<CreateConversationDialog />, { wrapper: createWrapper() });

		await openDialog();

		expect(screen.getByRole("button", { name: /^create$/i })).toBeDisabled();
	});

	it("Create button is enabled when title has content", async () => {
		render(<CreateConversationDialog />, { wrapper: createWrapper() });

		await openDialog();

		const input = screen.getByPlaceholderText(/requirements elicitation/i);
		await act(async () => {
			fireEvent.change(input, { target: { value: "My Conversation" } });
		});

		expect(screen.getByRole("button", { name: /^create$/i })).toBeEnabled();
	});

	it("calls createConversation with trimmed title on Create click", async () => {
		mockCreateConversation.mockResolvedValue({
			id: "conv-1",
			name: "My Conversation",
		});

		render(<CreateConversationDialog />, { wrapper: createWrapper() });

		await openDialog();

		const input = screen.getByPlaceholderText(/requirements elicitation/i);
		await act(async () => {
			fireEvent.change(input, { target: { value: "  My Conversation  " } });
		});

		await act(async () => {
			fireEvent.click(screen.getByRole("button", { name: /^create$/i }));
		});

		await waitFor(() => {
			expect(mockCreateConversation).toHaveBeenCalledWith(
				expect.objectContaining({
					data: expect.objectContaining({ name: "My Conversation" }),
				}),
			);
		});
	});

	it("closes dialog and calls navigate after successful creation", async () => {
		mockCreateConversation.mockResolvedValue({
			id: "conv-42",
			name: "Success Conv",
		});

		render(<CreateConversationDialog />, { wrapper: createWrapper() });

		await openDialog();

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

		expect(mockNavigate).toHaveBeenCalledWith({ to: "/chat/conv-42" });
	});

	it("Cancel button closes dialog without calling createConversation", async () => {
		render(<CreateConversationDialog />, { wrapper: createWrapper() });

		await openDialog();

		await act(async () => {
			fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
		});

		await waitFor(() => {
			expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
		});

		expect(mockCreateConversation).not.toHaveBeenCalled();
	});

	it("Enter key submits the form and calls createConversation", async () => {
		mockCreateConversation.mockResolvedValue({
			id: "conv-99",
			name: "Enter Conv",
		});

		render(<CreateConversationDialog />, { wrapper: createWrapper() });

		await openDialog();

		const input = screen.getByPlaceholderText(/requirements elicitation/i);
		await act(async () => {
			fireEvent.change(input, { target: { value: "Enter Conv" } });
		});

		await act(async () => {
			fireEvent.keyDown(input, { key: "Enter", code: "Enter" });
		});

		await waitFor(() => {
			expect(mockCreateConversation).toHaveBeenCalledWith(
				expect.objectContaining({
					data: expect.objectContaining({ name: "Enter Conv" }),
				}),
			);
		});
	});
});
