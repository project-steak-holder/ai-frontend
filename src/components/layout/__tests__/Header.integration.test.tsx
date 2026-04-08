import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Header } from "../Header";

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

vi.mock("@/integrations/neon-auth/client", () => ({
	authClient: {
		useSession: () => ({ data: { user: { id: "user-1" } } }),
	},
}));

vi.mock("@tanstack/react-router", () => ({
	useParams: vi.fn().mockReturnValue({ conversationId: "conv-1" }),
}));

vi.mock("@neondatabase/auth/react", () => ({
	UserButton: ({ size }: { size: string }) => (
		<button type="button" aria-label={`user-button-${size}`}>
			User
		</button>
	),
}));

const mockGetConversationById = vi.fn();

vi.mock("@server/api/conversations", () => ({
	getConversationById: (...args: unknown[]) => mockGetConversationById(...args),
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

describe("Header", () => {
	beforeEach(() => {
		mockGetConversationById.mockReset();
	});

	afterEach(() => {
		cleanup();
	});

	it("renders conversation name when loaded", async () => {
		mockGetConversationById.mockResolvedValue({
			id: "conv-1",
			name: "My Chat",
		});

		render(<Header />, { wrapper: createWrapper() });

		await waitFor(() => {
			expect(screen.getByText("My Chat")).toBeInTheDocument();
		});
	});

	it("renders error text when conversation fetch fails", async () => {
		mockGetConversationById.mockRejectedValue(
			new Error("Conversation not found"),
		);

		render(<Header />, { wrapper: createWrapper() });

		await waitFor(() => {
			expect(
				screen.getByText("Error loading conversation title"),
			).toBeInTheDocument();
		});
	});

	it("renders the UserButton", () => {
		mockGetConversationById.mockResolvedValue({ id: "conv-1", name: "Chat" });

		render(<Header />, { wrapper: createWrapper() });

		expect(
			screen.getByRole("button", { name: /user-button/i }),
		).toBeInTheDocument();
	});

	it("renders header element", () => {
		mockGetConversationById.mockResolvedValue({ id: "conv-1", name: "Chat" });

		render(<Header />, { wrapper: createWrapper() });

		expect(screen.getByRole("banner")).toBeInTheDocument();
	});
});
