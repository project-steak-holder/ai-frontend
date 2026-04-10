import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
	cleanup,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react";
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
	Link: ({
		to,
		params,
		children,
		onClick,
	}: {
		to: string;
		params?: Record<string, string>;
		children: React.ReactNode;
		onClick?: () => void;
	}) => {
		let href = to;
		if (params) {
			for (const [key, value] of Object.entries(params)) {
				href = href.replace(`$${key}`, value);
			}
		}
		return (
			<a href={href} onClick={onClick}>
				{children}
			</a>
		);
	},
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

vi.mock("@/components/ui/sheet", () => ({
	Sheet: ({
		children,
		open,
	}: {
		children: React.ReactNode;
		open?: boolean;
		onOpenChange?: (open: boolean) => void;
	}) => (
		<div data-testid="sheet" data-open={open ?? false}>
			{(open ?? false) ? children : null}
		</div>
	),
	SheetContent: ({
		children,
		side,
	}: {
		children: React.ReactNode;
		side: string;
	}) => (
		<div data-testid="sheet-content" data-side={side}>
			{children}
		</div>
	),
	SheetTitle: ({
		children,
		className,
	}: {
		children: React.ReactNode;
		className?: string;
	}) => (
		<div data-testid="sheet-title" className={className}>
			{children}
		</div>
	),
	SheetDescription: ({
		children,
		className,
	}: {
		children: React.ReactNode;
		className?: string;
	}) => (
		<div data-testid="sheet-description" className={className}>
			{children}
		</div>
	),
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
// Tests — sidebar content
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

		// Title appears in both desktop and mobile views
		const titles = screen.getAllByText("Stakeholder AI Chat");
		expect(titles.length).toBeGreaterThanOrEqual(1);
	});

	it("shows 'No conversations yet' when list is empty after query resolves", async () => {
		mockGetConversations.mockResolvedValue([]);

		render(<SideBar />, { wrapper: createWrapper() });

		await waitFor(() => {
			const messages = screen.getAllByText(/no conversations yet/i);
			expect(messages.length).toBeGreaterThanOrEqual(1);
		});
	});

	it("renders conversation names when list has items", async () => {
		mockGetConversations.mockResolvedValue(fakeConversations);

		render(<SideBar />, { wrapper: createWrapper() });

		await waitFor(() => {
			expect(screen.getAllByText("First Chat").length).toBeGreaterThanOrEqual(
				1,
			);
			expect(screen.getAllByText("Second Chat").length).toBeGreaterThanOrEqual(
				1,
			);
		});
	});

	it("conversation links point to correct /chat/{id} routes", async () => {
		mockGetConversations.mockResolvedValue(fakeConversations);

		render(<SideBar />, { wrapper: createWrapper() });

		await waitFor(() => {
			expect(screen.getAllByText("First Chat").length).toBeGreaterThanOrEqual(
				1,
			);
		});

		// Links appear in both desktop and mobile views
		const links = screen.getAllByRole("link");
		const chatLinks = links.filter((l) =>
			l.getAttribute("href")?.startsWith("/chat/"),
		);
		// At least 2 chat links in desktop, plus 2 in mobile sheet
		expect(chatLinks.length).toBeGreaterThanOrEqual(2);
	});

	it("shows error alert text when getConversations rejects", async () => {
		mockGetConversations.mockRejectedValue(
			new Error("Failed to fetch conversations"),
		);

		render(<SideBar />, { wrapper: createWrapper() });

		await waitFor(() => {
			const errors = screen.getAllByText("Failed to fetch conversations");
			expect(errors.length).toBeGreaterThanOrEqual(1);
		});
	});

	it("shows 'New Conversation' button because SignedIn is mocked as passthrough", async () => {
		mockGetConversations.mockResolvedValue([]);

		render(<SideBar />, { wrapper: createWrapper() });

		await waitFor(() => {
			const buttons = screen.getAllByRole("button", {
				name: /new conversation/i,
			});
			expect(buttons.length).toBeGreaterThanOrEqual(1);
		});
	});

	it("opens ConversationDialog when New Conversation button is clicked", async () => {
		mockGetConversations.mockResolvedValue([]);

		render(<SideBar />, { wrapper: createWrapper() });

		await waitFor(() => {
			const buttons = screen.getAllByRole("button", {
				name: /new conversation/i,
			});
			expect(buttons.length).toBeGreaterThanOrEqual(1);
		});

		// Click the New Conversation button to trigger the dialog store
		const button = screen.getAllByRole("button", {
			name: /new conversation/i,
		})[0];
		fireEvent.click(button);

		// ConversationDialog should appear
		await waitFor(() => {
			expect(screen.getByRole("dialog")).toBeInTheDocument();
		});
	});

	it("calls onOpenChange(false) when a conversation link is clicked in mobile", async () => {
		mockGetConversations.mockResolvedValue(fakeConversations);
		const onOpenChange = vi.fn();

		render(<SideBar open={true} onOpenChange={onOpenChange} />, {
			wrapper: createWrapper(),
		});

		await waitFor(() => {
			expect(screen.getAllByText("First Chat").length).toBeGreaterThanOrEqual(
				1,
			);
		});

		// Click the first "First Chat" link in the mobile sheet
		const sheetContent = screen.getByTestId("sheet-content");
		const mobileLink = sheetContent.querySelector('a[href="/chat/conv-1"]');
		expect(mobileLink).toBeInTheDocument();
		if (mobileLink) fireEvent.click(mobileLink);
		expect(onOpenChange).toHaveBeenCalledWith(false);
	});

	it("calls onOpenChange(false) when the title link is clicked in mobile", () => {
		mockGetConversations.mockResolvedValue([]);
		const onOpenChange = vi.fn();

		render(<SideBar open={true} onOpenChange={onOpenChange} />, {
			wrapper: createWrapper(),
		});

		// Click the title link inside the sheet
		const sheetContent = screen.getByTestId("sheet-content");
		const titleLink = sheetContent.querySelector('a[href="/"]');
		expect(titleLink).toBeInTheDocument();
		if (titleLink) fireEvent.click(titleLink);
		expect(onOpenChange).toHaveBeenCalledWith(false);
	});
});

// ---------------------------------------------------------------------------
// Tests — mobile Sheet drawer (regression tests)
// ---------------------------------------------------------------------------

describe("SideBar mobile drawer", () => {
	beforeEach(() => {
		mockGetConversations.mockReset();
		mockGetConversations.mockResolvedValue([]);
	});

	afterEach(() => {
		cleanup();
	});

	it("renders Sheet component for the mobile sidebar", () => {
		render(<SideBar />, { wrapper: createWrapper() });

		expect(screen.getByTestId("sheet")).toBeInTheDocument();
	});

	it("Sheet has left side positioning", () => {
		render(<SideBar open={true} onOpenChange={vi.fn()} />, {
			wrapper: createWrapper(),
		});

		const sheetContent = screen.getByTestId("sheet-content");
		expect(sheetContent.getAttribute("data-side")).toBe("left");
	});

	it("Sheet includes accessibility title and description", () => {
		render(<SideBar open={true} onOpenChange={vi.fn()} />, {
			wrapper: createWrapper(),
		});

		const sheetTitle = screen.getByTestId("sheet-title");
		const sheetDescription = screen.getByTestId("sheet-description");
		expect(sheetTitle.textContent).toBe("Navigation");
		expect(sheetDescription.textContent).toBe(
			"Conversation list and user profile",
		);
	});

	it("desktop sidebar wrapper has hidden md:block and w-64 classes", () => {
		const { container } = render(<SideBar />, {
			wrapper: createWrapper(),
		});

		const desktopWrapper = container.querySelector(
			".hidden.md\\:block.shrink-0.w-64",
		);
		expect(desktopWrapper).toBeInTheDocument();
	});

	it("renders sidebar content in both desktop and mobile wrappers", () => {
		render(<SideBar open={true} onOpenChange={vi.fn()} />, {
			wrapper: createWrapper(),
		});

		// Both desktop and mobile should have the title
		const titles = screen.getAllByText("Stakeholder AI Chat");
		expect(titles.length).toBe(2);
	});

	it("passes open prop to Sheet", () => {
		render(<SideBar open={true} onOpenChange={vi.fn()} />, {
			wrapper: createWrapper(),
		});

		const sheet = screen.getByTestId("sheet");
		expect(sheet.getAttribute("data-open")).toBe("true");
	});

	it("Sheet is closed by default when no open prop is provided", () => {
		render(<SideBar />, { wrapper: createWrapper() });

		const sheet = screen.getByTestId("sheet");
		expect(sheet.getAttribute("data-open")).toBe("false");
	});
});

// ---------------------------------------------------------------------------
// Tests — loading state
// ---------------------------------------------------------------------------

describe("SideBar loading state", () => {
	beforeEach(() => {
		mockGetConversations.mockReset();
	});

	afterEach(() => {
		cleanup();
	});

	it("renders blank when isLoading is true (does not show conversations, error, or empty state)", async () => {
		// Return a promise that never resolves to simulate loading state indefinitely
		mockGetConversations.mockReturnValue(
			new Promise(() => {
				// Never resolves — keeps component in loading state
			}),
		);

		const { container } = render(<SideBar />, { wrapper: createWrapper() });

		// The component should render but not show conversation links
		const sidebarContent = container.querySelector(".flex.flex-col.bg-sidebar");
		expect(sidebarContent).toBeInTheDocument();

		// "No conversations yet" should not appear while loading
		expect(screen.queryByText(/no conversations yet/i)).not.toBeInTheDocument();

		// Conversation links should not render while loading
		expect(screen.queryByText("First Chat")).not.toBeInTheDocument();
		expect(screen.queryByText("Second Chat")).not.toBeInTheDocument();
	});
});
