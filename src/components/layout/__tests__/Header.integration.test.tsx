import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
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

vi.mock("@neondatabase/neon-js/auth/react", () => ({
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
// Tests — desktop header
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

	it("renders header element with flex layout", () => {
		mockGetConversationById.mockResolvedValue({ id: "conv-1", name: "Chat" });

		const { container } = render(<Header />, { wrapper: createWrapper() });

		const header = container.querySelector("header");
		expect(header).toBeInTheDocument();
		expect(header?.className).toContain("flex");
	});
});

// ---------------------------------------------------------------------------
// Tests — mobile top bar (regression tests)
// ---------------------------------------------------------------------------

describe("Header mobile top bar", () => {
	beforeEach(() => {
		mockGetConversationById.mockReset();
		mockGetConversationById.mockResolvedValue({ id: "conv-1", name: "Chat" });
	});

	afterEach(() => {
		cleanup();
	});

	it("renders hamburger menu button with correct aria-label", () => {
		render(<Header />, { wrapper: createWrapper() });

		const hamburgerButton = screen.getByLabelText("Open navigation menu");
		expect(hamburgerButton).toBeInTheDocument();
		expect(hamburgerButton.tagName).toBe("BUTTON");
	});

	it("hamburger button has md:hidden class for responsive hiding", () => {
		render(<Header />, { wrapper: createWrapper() });

		const hamburgerButton = screen.getByLabelText("Open navigation menu");
		expect(hamburgerButton.className).toContain("md:hidden");
	});

	it("hamburger button has ghost variant and icon size", () => {
		render(<Header />, { wrapper: createWrapper() });

		const hamburgerButton = screen.getByLabelText("Open navigation menu");
		expect(hamburgerButton).toHaveAttribute("data-variant", "ghost");
		expect(hamburgerButton).toHaveAttribute("data-size", "icon");
	});

	it("calls onMenuClick when hamburger button is clicked", () => {
		const onMenuClick = vi.fn();

		render(<Header onMenuClick={onMenuClick} />, {
			wrapper: createWrapper(),
		});

		const hamburgerButton = screen.getByLabelText("Open navigation menu");
		fireEvent.click(hamburgerButton);
		expect(onMenuClick).toHaveBeenCalledOnce();
	});

	it("hamburger button is inside the header", () => {
		const { container } = render(<Header />, { wrapper: createWrapper() });

		const header = container.querySelector("header");
		expect(header).toBeInTheDocument();

		const hamburgerButton = header?.querySelector(
			'button[aria-label="Open navigation menu"]',
		);
		expect(hamburgerButton).toBeInTheDocument();
	});

	it("clicking hamburger button with no onMenuClick prop is a safe no-op", () => {
		mockGetConversationById.mockResolvedValue({ id: "conv-1", name: "Chat" });

		// Render without onMenuClick prop (undefined)
		render(<Header />, { wrapper: createWrapper() });

		const hamburgerButton = screen.getByLabelText("Open navigation menu");
		// Should not throw when clicking
		expect(() => {
			fireEvent.click(hamburgerButton);
		}).not.toThrow();

		// Button should still be in the document and functional
		expect(hamburgerButton).toBeInTheDocument();
	});
});
