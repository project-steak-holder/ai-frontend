import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

const mockStreamMessage = vi.fn();
const VALID_UUID = "550e8400-e29b-41d4-a716-446655440000";

const mockUseStreamingResponse = vi.fn().mockReturnValue({
	sendMessage: mockStreamMessage,
	streamedText: "",
	isStreaming: false,
});

vi.mock("@neondatabase/neon-js/auth/react/ui", () => ({
	SignedIn: ({ children }: { children: React.ReactNode }) => (
		<div data-testid="signed-in">{children}</div>
	),
	SignedOut: ({ children }: { children: React.ReactNode }) => (
		<div data-testid="signed-out">{children}</div>
	),
}));

vi.mock("@tanstack/react-router", () => ({
	createFileRoute: () => (options: Record<string, unknown>) => ({
		...options,
		useParams: () => ({ conversationId: VALID_UUID }),
	}),
	redirect: vi.fn((opts: { to: string }) => {
		throw new Error(`Redirect to ${opts.to}`);
	}),
}));

vi.mock("@/components/layout/ChatLayout", () => ({
	ChatLayout: ({
		conversationId,
		streamedText,
	}: {
		conversationId: string;
		streamedText?: string;
	}) => (
		<div data-testid="chat-layout" data-conversation-id={conversationId}>
			{streamedText && <span data-testid="streamed-text">{streamedText}</span>}
		</div>
	),
}));

vi.mock("@/components/ui/input", () => ({
	Input: (props: React.InputHTMLAttributes<HTMLInputElement>) => (
		<input {...props} />
	),
}));

vi.mock("@/lib/hooks/messages", () => ({
	useStreamingResponse: (...args: unknown[]) =>
		mockUseStreamingResponse(...args),
}));

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Chat route (chat/$conversationId.tsx)", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockUseStreamingResponse.mockReturnValue({
			sendMessage: mockStreamMessage,
			streamedText: "",
			isStreaming: false,
		});
	});

	it("exports a Route object", async () => {
		const chatModule = await import("@/routes/chat/$conversationId");
		expect(chatModule.Route).toBeDefined();
	});

	describe("beforeLoad param validation", () => {
		it("does not throw for a valid UUID param", async () => {
			const chatModule = await import("@/routes/chat/$conversationId");
			const beforeLoad = chatModule.Route.beforeLoad;
			if (!beforeLoad) throw new Error("beforeLoad not defined");

			expect(() =>
				beforeLoad({
					params: { conversationId: VALID_UUID },
				}),
			).not.toThrow();
		});

		it("throws redirect for an invalid UUID param", async () => {
			const chatModule = await import("@/routes/chat/$conversationId");
			const beforeLoad = chatModule.Route.beforeLoad;
			if (!beforeLoad) throw new Error("beforeLoad not defined");

			expect(() =>
				beforeLoad({
					params: { conversationId: "not-a-uuid" },
				}),
			).toThrow(/redirect/i);
		});

		it("throws redirect for empty string param", async () => {
			const chatModule = await import("@/routes/chat/$conversationId");
			const beforeLoad = chatModule.Route.beforeLoad;
			if (!beforeLoad) throw new Error("beforeLoad not defined");

			expect(() =>
				beforeLoad({
					params: { conversationId: "" },
				}),
			).toThrow(/redirect/i);
		});
	});

	describe("ChatPage component", () => {
		it("renders ChatLayout with the conversation ID", async () => {
			const chatModule = await import("@/routes/chat/$conversationId");
			const ChatComponent = chatModule.Route.component;
			if (!ChatComponent) throw new Error("component not defined");

			render(<ChatComponent />);

			const chatLayout = screen.getByTestId("chat-layout");
			expect(chatLayout).toBeInTheDocument();
			expect(chatLayout.getAttribute("data-conversation-id")).toBe(VALID_UUID);
		});

		it("renders message input field", async () => {
			const chatModule = await import("@/routes/chat/$conversationId");
			const ChatComponent = chatModule.Route.component;
			if (!ChatComponent) throw new Error("component not defined");

			render(<ChatComponent />);

			const input = screen.getByPlaceholderText("Type a message...");
			expect(input).toBeInTheDocument();
			expect(input).toHaveAttribute("name", "message");
			expect(input).toHaveAttribute("autocomplete", "off");
		});

		it("renders SignedIn and SignedOut sections", async () => {
			const chatModule = await import("@/routes/chat/$conversationId");
			const ChatComponent = chatModule.Route.component;
			if (!ChatComponent) throw new Error("component not defined");

			render(<ChatComponent />);

			expect(screen.getByTestId("signed-in")).toBeInTheDocument();
			expect(screen.getByTestId("signed-out")).toBeInTheDocument();
		});

		it("shows sign-in message in SignedOut section", async () => {
			const chatModule = await import("@/routes/chat/$conversationId");
			const ChatComponent = chatModule.Route.component;
			if (!ChatComponent) throw new Error("component not defined");

			render(<ChatComponent />);

			const signedOut = screen.getByTestId("signed-out");
			expect(signedOut).toHaveTextContent(
				/please sign in to view the conversation/i,
			);
		});

		it("calls streamMessage on form submit with non-empty input", async () => {
			const chatModule = await import("@/routes/chat/$conversationId");
			const ChatComponent = chatModule.Route.component;
			if (!ChatComponent) throw new Error("component not defined");

			render(<ChatComponent />);

			const input = screen.getByPlaceholderText(
				"Type a message...",
			) as HTMLInputElement;
			fireEvent.change(input, { target: { value: "Hello AI" } });

			const form = input.closest("form") as HTMLFormElement;
			expect(form).toBeTruthy();
			fireEvent.submit(form);

			expect(mockStreamMessage).toHaveBeenCalledWith("Hello AI");
		});

		it("clears input after successful form submit", async () => {
			const chatModule = await import("@/routes/chat/$conversationId");
			const ChatComponent = chatModule.Route.component;
			if (!ChatComponent) throw new Error("component not defined");

			render(<ChatComponent />);

			const input = screen.getByPlaceholderText(
				"Type a message...",
			) as HTMLInputElement;
			fireEvent.change(input, { target: { value: "Hello" } });
			fireEvent.submit(input.closest("form") as HTMLFormElement);

			expect(input.value).toBe("");
		});

		it("does not call streamMessage when input is empty", async () => {
			const chatModule = await import("@/routes/chat/$conversationId");
			const ChatComponent = chatModule.Route.component;
			if (!ChatComponent) throw new Error("component not defined");

			render(<ChatComponent />);

			const input = screen.getByPlaceholderText(
				"Type a message...",
			) as HTMLInputElement;
			fireEvent.submit(input.closest("form") as HTMLFormElement);

			expect(mockStreamMessage).not.toHaveBeenCalled();
		});

		it("does not call streamMessage when input is only whitespace", async () => {
			const chatModule = await import("@/routes/chat/$conversationId");
			const ChatComponent = chatModule.Route.component;
			if (!ChatComponent) throw new Error("component not defined");

			render(<ChatComponent />);

			const input = screen.getByPlaceholderText(
				"Type a message...",
			) as HTMLInputElement;
			fireEvent.change(input, { target: { value: "   " } });
			fireEvent.submit(input.closest("form") as HTMLFormElement);

			expect(mockStreamMessage).not.toHaveBeenCalled();
		});
	});

	describe("streaming state", () => {
		it("disables input when streaming", async () => {
			mockUseStreamingResponse.mockReturnValue({
				sendMessage: mockStreamMessage,
				streamedText: "Streaming...",
				isStreaming: true,
			});

			const chatModule = await import("@/routes/chat/$conversationId");
			const ChatComponent = chatModule.Route.component;
			if (!ChatComponent) throw new Error("component not defined");

			render(<ChatComponent />);

			const input = screen.getByPlaceholderText("Type a message...");
			expect(input).toBeDisabled();
		});

		it("passes streamedText to ChatLayout when streaming", async () => {
			mockUseStreamingResponse.mockReturnValue({
				sendMessage: mockStreamMessage,
				streamedText: "Partial response...",
				isStreaming: true,
			});

			const chatModule = await import("@/routes/chat/$conversationId");
			const ChatComponent = chatModule.Route.component;
			if (!ChatComponent) throw new Error("component not defined");

			render(<ChatComponent />);

			expect(screen.getByTestId("streamed-text")).toHaveTextContent(
				"Partial response...",
			);
		});

		it("does not pass streamedText to ChatLayout when not streaming", async () => {
			mockUseStreamingResponse.mockReturnValue({
				sendMessage: mockStreamMessage,
				streamedText: "leftover text",
				isStreaming: false,
			});

			const chatModule = await import("@/routes/chat/$conversationId");
			const ChatComponent = chatModule.Route.component;
			if (!ChatComponent) throw new Error("component not defined");

			render(<ChatComponent />);

			expect(screen.queryByTestId("streamed-text")).not.toBeInTheDocument();
		});
	});
});
