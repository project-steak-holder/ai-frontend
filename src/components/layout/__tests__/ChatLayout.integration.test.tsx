import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ChatLayout } from "../ChatLayout";

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

vi.mock("@/integrations/neon-auth/client", () => ({
	authClient: {
		useSession: () => ({ data: { user: { id: "user-1" } } }),
	},
}));

const mockGet = vi.fn();

vi.mock("@/server/api/messages", () => ({
	getMessagesByConversationId: (...args: unknown[]) => mockGet(...args),
	streamMessage: vi.fn(),
}));

vi.mock("@/server/api/messages/streamMessage", () => ({
	streamMessage: vi.fn(),
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

	it("shows streaming indicator (SVG) when streamedText is empty string", async () => {
		mockGet.mockResolvedValue([userMessage]);

		render(<ChatLayout conversationId="conv-1" streamedText="" />, {
			wrapper: createWrapper(),
		});

		await waitFor(() => {
			expect(screen.getByText("Hello AI")).toBeInTheDocument();
		});

		// ThreeDotsMoveIcon renders an SVG element
		const svgElements = document.querySelectorAll("svg");
		expect(svgElements.length).toBeGreaterThan(0);
	});

	it("shows streamed text when streamedText has content", async () => {
		mockGet.mockResolvedValue([userMessage]);

		render(
			<ChatLayout conversationId="conv-1" streamedText="Streaming reply..." />,
			{
				wrapper: createWrapper(),
			},
		);

		await waitFor(() => {
			expect(screen.getByText("Streaming reply...")).toBeInTheDocument();
		});
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

	it("applies responsive max-width classes to user message bubbles", async () => {
		mockGet.mockResolvedValue([userMessage]);

		render(<ChatLayout conversationId="conv-1" />, {
			wrapper: createWrapper(),
		});

		await waitFor(() => {
			const bubble = screen.getByTestId("user-message");
			expect(bubble.className).toContain("max-w-[85%]");
			expect(bubble.className).toContain("sm:max-w-[70%]");
			expect(bubble.className).toContain("md:max-w-[60%]");
			expect(bubble.className).toContain("lg:max-w-[52%]");
		});
	});

	it("applies user-specific styles to user message bubbles", async () => {
		mockGet.mockResolvedValue([userMessage]);

		render(<ChatLayout conversationId="conv-1" />, {
			wrapper: createWrapper(),
		});

		await waitFor(() => {
			const bubble = screen.getByTestId("user-message");
			expect(bubble.className).toContain("bg-primary");
			expect(bubble.className).toContain("text-primary-foreground");
			expect(bubble.className).toContain("rounded-br-sm");
			expect(bubble.className).toContain("order-1");
		});
	});

	it("applies AI-specific styles to AI message bubbles", async () => {
		mockGet.mockResolvedValue([aiMessage]);

		render(<ChatLayout conversationId="conv-1" />, {
			wrapper: createWrapper(),
		});

		await waitFor(() => {
			const bubble = screen.getByTestId("ai-message");
			expect(bubble.className).toContain("bg-muted");
			expect(bubble.className).toContain("text-foreground");
			expect(bubble.className).toContain("rounded-bl-sm");
			expect(bubble.className).toContain("order-2");
		});
	});

	it("applies AI-specific styles to streaming message bubble", async () => {
		mockGet.mockResolvedValue([userMessage]);

		render(
			<ChatLayout conversationId="conv-1" streamedText="Streaming..." />,
			{ wrapper: createWrapper() },
		);

		await waitFor(() => {
			const bubble = screen.getByTestId("ai-message-streaming");
			expect(bubble.className).toContain("bg-muted");
			expect(bubble.className).toContain("text-foreground");
			expect(bubble.className).toContain("rounded-bl-sm");
			expect(bubble.className).toContain("order-2");
		});
	});

	it("applies responsive padding to message container", async () => {
		mockGet.mockResolvedValue([userMessage]);

		const { container } = render(
			<ChatLayout conversationId="conv-1" />,
			{ wrapper: createWrapper() },
		);

		await waitFor(() => {
			const messageContainer = container.querySelector(
				".flex.h-full.flex-col.justify-end",
			);
			expect(messageContainer).toBeInTheDocument();
			expect(messageContainer?.className).toContain("px-3");
			expect(messageContainer?.className).toContain("py-4");
			expect(messageContainer?.className).toContain("sm:px-6");
			expect(messageContainer?.className).toContain("md:p-16");
		});
	});
});
