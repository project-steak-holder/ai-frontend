import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

vi.mock("@integrations/neon-auth/client", () => ({
	authClient: {
		useSession: () => ({ data: { user: { id: "user-1" } } }),
	},
}));

vi.mock("@neondatabase/neon-js/auth/react", () => ({
	NeonAuthUIProvider: ({ children }: { children: React.ReactNode }) => (
		<>{children}</>
	),
}));

vi.mock("@neondatabase/auth/react", () => ({
	UserButton: () => <div data-testid="user-button" />,
}));

vi.mock("@/components/error-handling/RootErrorBoundary", () => ({
	RootErrorBoundary: ({ children }: { children: React.ReactNode }) => (
		<div data-testid="root-error-boundary">{children}</div>
	),
}));

vi.mock("@/components/error-handling/RouteErrorBoundary", () => ({
	RouteErrorBoundary: ({ error }: { error: Error }) => (
		<div data-testid="route-error-boundary">{error.message}</div>
	),
}));

vi.mock("@/components/layout/SideBar", () => ({
	SideBar: ({
		open,
		onOpenChange,
	}: {
		open?: boolean;
		onOpenChange?: (open: boolean) => void;
	}) => (
		<div
			data-testid="sidebar"
			data-open={open ?? false}
			data-has-on-open-change={!!onOpenChange}
		>
			SideBar
		</div>
	),
}));

vi.mock("@/components/layout/Header", () => ({
	Header: ({ onMenuClick }: { onMenuClick?: () => void }) => (
		<div data-testid="header" data-has-on-menu-click={!!onMenuClick}>
			Header
		</div>
	),
}));

vi.mock("@/components/ui/sonner", () => ({
	Toaster: () => <div data-testid="toaster" />,
}));

vi.mock("@/components/ui/tooltip", () => ({
	TooltipProvider: ({ children }: { children: React.ReactNode }) => (
		<>{children}</>
	),
}));

vi.mock("@tanstack/react-router", () => ({
	createRootRouteWithContext: () => (options: Record<string, unknown>) => ({
		options,
		...options,
	}),
	HeadContent: () => null,
	Scripts: () => null,
}));

// CSS import mock
vi.mock("../styles.css?url", () => ({ default: "styles.css" }));

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Root layout (__root.tsx)", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("Route configuration", () => {
		it("exports a Route object", async () => {
			const rootModule = await import("@/routes/__root");
			expect(rootModule.Route).toBeDefined();
		});

		it("has head metadata with correct title", async () => {
			const rootModule = await import("@/routes/__root");
			const head = rootModule.Route.options.head?.();
			const titleMeta = head?.meta?.find(
				(m: Record<string, string>) => "title" in m,
			);
			expect(titleMeta?.title).toBe("Stakeholder AI Chat");
		});

		it("has head metadata with charset and viewport", async () => {
			const rootModule = await import("@/routes/__root");
			const head = rootModule.Route.options.head?.();
			const charsetMeta = head?.meta?.find(
				(m: Record<string, string>) => m.charSet === "utf-8",
			);
			const viewportMeta = head?.meta?.find(
				(m: Record<string, string>) => m.name === "viewport",
			);
			expect(charsetMeta).toBeDefined();
			expect(viewportMeta).toBeDefined();
			expect(viewportMeta?.content).toBe("width=device-width, initial-scale=1");
		});

		it("has a stylesheet link in head", async () => {
			const rootModule = await import("@/routes/__root");
			const head = rootModule.Route.options.head?.();
			const stylesheetLink = head?.links?.find(
				(l: Record<string, string>) => l.rel === "stylesheet",
			);
			expect(stylesheetLink).toBeDefined();
		});
	});

	describe("errorComponent", () => {
		it("renders RouteErrorBoundary with the error", async () => {
			const rootModule = await import("@/routes/__root");
			const ErrorComponent = rootModule.Route.options.errorComponent;
			if (!ErrorComponent) throw new Error("errorComponent not defined");

			render(<ErrorComponent error={new Error("Test route error")} />);
			expect(screen.getByTestId("route-error-boundary")).toBeInTheDocument();
			expect(screen.getByText("Test route error")).toBeInTheDocument();
		});
	});

	describe("notFoundComponent", () => {
		it("renders 'Page not found.' message", async () => {
			const rootModule = await import("@/routes/__root");
			const NotFoundComponent = rootModule.Route.options.notFoundComponent;
			if (!NotFoundComponent) throw new Error("notFoundComponent not defined");

			render(<NotFoundComponent />);
			expect(screen.getByText("Page not found.")).toBeInTheDocument();
		});
	});

	describe("shellComponent (RootDocument)", () => {
		it("renders RootErrorBoundary wrapping the content", async () => {
			const rootModule = await import("@/routes/__root");
			const ShellComponent = rootModule.Route.options.shellComponent;
			if (!ShellComponent) throw new Error("shellComponent not defined");

			render(
				<ShellComponent>
					<div>Test Content</div>
				</ShellComponent>,
			);
			expect(screen.getByTestId("root-error-boundary")).toBeInTheDocument();
		});

		it("renders SideBar component", async () => {
			const rootModule = await import("@/routes/__root");
			const ShellComponent = rootModule.Route.options.shellComponent;
			if (!ShellComponent) throw new Error("shellComponent not defined");

			render(
				<ShellComponent>
					<div>Content</div>
				</ShellComponent>,
			);
			expect(screen.getByTestId("sidebar")).toBeInTheDocument();
		});

		it("renders Header component", async () => {
			const rootModule = await import("@/routes/__root");
			const ShellComponent = rootModule.Route.options.shellComponent;
			if (!ShellComponent) throw new Error("shellComponent not defined");

			render(
				<ShellComponent>
					<div>Content</div>
				</ShellComponent>,
			);
			expect(screen.getByTestId("header")).toBeInTheDocument();
		});

		it("renders Toaster for toast notifications", async () => {
			const rootModule = await import("@/routes/__root");
			const ShellComponent = rootModule.Route.options.shellComponent;
			if (!ShellComponent) throw new Error("shellComponent not defined");

			render(
				<ShellComponent>
					<div>Content</div>
				</ShellComponent>,
			);
			expect(screen.getByTestId("toaster")).toBeInTheDocument();
		});

		it("renders children in the main content area", async () => {
			const rootModule = await import("@/routes/__root");
			const ShellComponent = rootModule.Route.options.shellComponent;
			if (!ShellComponent) throw new Error("shellComponent not defined");

			render(
				<ShellComponent>
					<div>Page Content</div>
				</ShellComponent>,
			);
			expect(screen.getByText("Page Content")).toBeInTheDocument();
			expect(screen.getByRole("main")).toBeInTheDocument();
		});

		it("uses dark theme on html element", async () => {
			const rootModule = await import("@/routes/__root");
			const ShellComponent = rootModule.Route.options.shellComponent;
			if (!ShellComponent) throw new Error("shellComponent not defined");

			render(
				<ShellComponent>
					<div>Content</div>
				</ShellComponent>,
			);
			const html = document.querySelector("html");
			expect(html?.className).toContain("dark");
		});

		it("sets lang attribute to 'en' on html element", async () => {
			const rootModule = await import("@/routes/__root");
			const ShellComponent = rootModule.Route.options.shellComponent;
			if (!ShellComponent) throw new Error("shellComponent not defined");

			render(
				<ShellComponent>
					<div>Content</div>
				</ShellComponent>,
			);
			const html = document.querySelector("html");
			expect(html?.getAttribute("lang")).toBe("en");
		});

		it("passes onOpenChange prop to SideBar for state coordination", async () => {
			const rootModule = await import("@/routes/__root");
			const ShellComponent = rootModule.Route.options.shellComponent;
			if (!ShellComponent) throw new Error("shellComponent not defined");

			render(
				<ShellComponent>
					<div>Content</div>
				</ShellComponent>,
			);

			const sidebar = screen.getByTestId("sidebar");
			expect(sidebar.getAttribute("data-has-on-open-change")).toBe("true");
		});

		it("passes onMenuClick prop to Header for state coordination", async () => {
			const rootModule = await import("@/routes/__root");
			const ShellComponent = rootModule.Route.options.shellComponent;
			if (!ShellComponent) throw new Error("shellComponent not defined");

			render(
				<ShellComponent>
					<div>Content</div>
				</ShellComponent>,
			);

			const header = screen.getByTestId("header");
			expect(header.getAttribute("data-has-on-menu-click")).toBe("true");
		});

		it("layout uses flexbox for proper responsive behavior", async () => {
			const rootModule = await import("@/routes/__root");
			const ShellComponent = rootModule.Route.options.shellComponent;
			if (!ShellComponent) throw new Error("shellComponent not defined");

			const { container } = render(
				<ShellComponent>
					<div>Content</div>
				</ShellComponent>,
			);

			const rootFlex = container.querySelector(".flex.h-screen");
			expect(rootFlex).toBeInTheDocument();

			const contentArea = container.querySelector(".flex-1.flex.flex-col");
			expect(contentArea).toBeInTheDocument();
		});

		it("renders main content area with flex-1 and overflow-auto", async () => {
			const rootModule = await import("@/routes/__root");
			const ShellComponent = rootModule.Route.options.shellComponent;
			if (!ShellComponent) throw new Error("shellComponent not defined");

			const { container } = render(
				<ShellComponent>
					<div>Test Content</div>
				</ShellComponent>,
			);

			const mainElement = container.querySelector("main");
			expect(mainElement).toBeInTheDocument();
			expect(mainElement?.className).toContain("flex-1");
			expect(mainElement?.className).toContain("overflow-auto");
		});
	});
});
