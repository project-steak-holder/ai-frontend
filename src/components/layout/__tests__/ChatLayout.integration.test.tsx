import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ChatLayout from "../ChatLayout";

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

vi.mock("@/integrations/neon-auth/client", () => ({
	authClient: {
		useSession: () => ({ data: { user: { id: "user-1" } } }),
	},
}));

const mockGet = vi.fn();

vi.mock("@server/api/messages", () => ({
	getMessagesByConversationId: (...args: unknown[]) => mockGet(...args),
}));

vi.mock("@neondatabase/neon-js/auth/react", () => ({
	UserAvatar: () => <div data-testid="user-avatar" />,
}));

// ---------------------------------------------------------------------------
// Fake data
// ---------------------------------------------------------------------------

const userMessage = {
	id: "msg-1",
	conversationId: "conv-1",
	userId: "user-1",
	content: "Hello AI",
	type: "USER" as const,
	createdAt: new Date().toISOString(),
	updatedAt: new Date().toISOString(),
};

const aiMessage = {
	id: "msg-2",
	conversationId: "conv-1",
	userId: "user-1",
	content: "Hello human",
	type: "AI" as const,
	createdAt: new Date().toISOString(),
	updatedAt: new Date().toISOString(),
};

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

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("ChatLayout", () => {
	beforeEach(() => {
		mockGet.mockReset();
	});

	afterEach(() => {
		cleanup();
	});

	it("shows 'Loading messages...' when query is pending", () => {
		mockGet.mockReturnValue(new Promise(() => {}));

		render(<ChatLayout conversationId="conv-1" />, {
			wrapper: createWrapper(),
		});

		expect(screen.getByText("Loading messages...")).toBeInTheDocument();
	});

	it("shows error text including error message when query rejects", async () => {
		mockGet.mockRejectedValue(new Error("Network error"));

		render(<ChatLayout conversationId="conv-1" />, {
			wrapper: createWrapper(),
		});

		await waitFor(() => {
			expect(
				screen.getByText(/Error loading messages: Network error/i),
			).toBeInTheDocument();
		});
	});

	it("shows 'No messages yet.' when query resolves with empty array", async () => {
		mockGet.mockResolvedValue([]);

		render(<ChatLayout conversationId="conv-1" />, {
			wrapper: createWrapper(),
		});

		await waitFor(() => {
			expect(screen.getByText("No messages yet.")).toBeInTheDocument();
		});
	});

	it("renders USER message content", async () => {
		mockGet.mockResolvedValue([userMessage]);

		render(<ChatLayout conversationId="conv-1" />, {
			wrapper: createWrapper(),
		});

		await waitFor(() => {
			expect(screen.getByText("Hello AI")).toBeInTheDocument();
		});
	});

	it("renders AI message content", async () => {
		mockGet.mockResolvedValue([aiMessage]);

		render(<ChatLayout conversationId="conv-1" />, {
			wrapper: createWrapper(),
		});

		await waitFor(() => {
			expect(screen.getByText("Hello human")).toBeInTheDocument();
		});
	});

	it("renders user-avatar for USER type messages", async () => {
		mockGet.mockResolvedValue([userMessage]);

		render(<ChatLayout conversationId="conv-1" />, {
			wrapper: createWrapper(),
		});

		await waitFor(() => {
			expect(screen.getByTestId("user-avatar")).toBeInTheDocument();
		});
	});

	it("shows streaming indicator (SVG) when waitingOnResponse is true", async () => {
		mockGet.mockResolvedValue([userMessage]);

		render(<ChatLayout conversationId="conv-1" waitingOnResponse={true} />, {
			wrapper: createWrapper(),
		});

		await waitFor(() => {
			expect(screen.getByText("Hello AI")).toBeInTheDocument();
		});

		// ThreeDotsMoveIcon renders an SVG element
		const svgElements = document.querySelectorAll("svg");
		expect(svgElements.length).toBeGreaterThan(0);
	});

	it("renders multiple messages with both USER and AI content visible", async () => {
		mockGet.mockResolvedValue([userMessage, aiMessage]);

		render(<ChatLayout conversationId="conv-1" />, {
			wrapper: createWrapper(),
		});

		await waitFor(() => {
			expect(screen.getByText("Hello AI")).toBeInTheDocument();
			expect(screen.getByText("Hello human")).toBeInTheDocument();
		});
	});
});
