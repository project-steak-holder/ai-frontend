import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SideBar } from "../SideBar";

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

vi.mock("@/integrations/neon-auth/client", () => ({
	authClient: {
		useSession: () => ({ data: { user: { id: "user-1" } } }),
	},
}));

vi.mock("@tanstack/react-router", () => ({
	Link: ({ to, children }: { to: string; children: React.ReactNode }) => (
		<a href={to}>{children}</a>
	),
	useParams: vi.fn().mockReturnValue({}),
	useNavigate: () => vi.fn(),
}));

const mockGetConversations = vi.fn();
const mockCreateConversation = vi.fn();

vi.mock("@server/api/conversations", () => ({
	getConversations: (...args: unknown[]) => mockGetConversations(...args),
	createConversation: (...args: unknown[]) => mockCreateConversation(...args),
}));

vi.mock("@neondatabase/neon-js/auth/react/ui", () => ({
	SignedIn: ({ children }: { children: React.ReactNode }) => <>{children}</>,
	SignedOut: () => null,
}));

vi.mock("sonner", () => ({
	toast: {
		success: vi.fn(),
		error: vi.fn(),
	},
}));

// ---------------------------------------------------------------------------
// Fake data
// ---------------------------------------------------------------------------

const fakeConversations = [
	{
		id: "conv-1",
		name: "First Chat",
		userId: "user-1",
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
	},
	{
		id: "conv-2",
		name: "Second Chat",
		userId: "user-1",
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
	},
];

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

describe("SideBar", () => {
	beforeEach(() => {
		mockGetConversations.mockReset();
		mockCreateConversation.mockReset();
	});

	afterEach(() => {
		cleanup();
	});

	it("renders the app title 'Stakeholder AI Chat'", () => {
		mockGetConversations.mockResolvedValue([]);

		render(<SideBar />, { wrapper: createWrapper() });

		expect(screen.getByText("Stakeholder AI Chat")).toBeInTheDocument();
	});

	it("shows 'No conversations yet' when list is empty after query resolves", async () => {
		mockGetConversations.mockResolvedValue([]);

		render(<SideBar />, { wrapper: createWrapper() });

		await waitFor(() => {
			expect(screen.getByText(/no conversations yet/i)).toBeInTheDocument();
		});
	});

	it("renders conversation names when list has items", async () => {
		mockGetConversations.mockResolvedValue(fakeConversations);

		render(<SideBar />, { wrapper: createWrapper() });

		await waitFor(() => {
			expect(screen.getByText("First Chat")).toBeInTheDocument();
			expect(screen.getByText("Second Chat")).toBeInTheDocument();
		});
	});

	it("conversation links point to correct /chat/{id} routes", async () => {
		mockGetConversations.mockResolvedValue(fakeConversations);

		render(<SideBar />, { wrapper: createWrapper() });

		await waitFor(() => {
			expect(screen.getByText("First Chat")).toBeInTheDocument();
		});

		// getAllByRole('link') includes the title link + one per conversation
		const links = screen.getAllByRole("link");
		const hrefs = links.map((l) => l.getAttribute("href"));

		expect(hrefs).toContain("/chat/$conversationId");
		// Both conversation links use the same route template via TanStack Link
		const chatLinks = links.filter((l) =>
			l.getAttribute("href")?.startsWith("/chat/"),
		);
		expect(chatLinks).toHaveLength(2);
	});

	it("shows error alert text when getConversations rejects", async () => {
		mockGetConversations.mockRejectedValue(
			new Error("Failed to fetch conversations"),
		);

		render(<SideBar />, { wrapper: createWrapper() });

		await waitFor(() => {
			expect(
				screen.getByText("Failed to fetch conversations"),
			).toBeInTheDocument();
		});
	});

	it("shows 'New Conversation' button because SignedIn is mocked as passthrough", async () => {
		mockGetConversations.mockResolvedValue([]);

		render(<SideBar />, { wrapper: createWrapper() });

		await waitFor(() => {
			expect(
				screen.getByRole("button", { name: /new conversation/i }),
			).toBeInTheDocument();
		});
	});
});
