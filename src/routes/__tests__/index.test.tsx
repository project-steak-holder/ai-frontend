import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

const mockSignedIn = vi.fn();
const mockSignedOut = vi.fn();

vi.mock("@neondatabase/neon-js/auth/react/ui", () => ({
	SignedIn: ({ children }: { children: React.ReactNode }) => {
		mockSignedIn();
		return <div data-testid="signed-in">{children}</div>;
	},
	SignedOut: ({ children }: { children: React.ReactNode }) => {
		mockSignedOut();
		return <div data-testid="signed-out">{children}</div>;
	},
}));

vi.mock("@tanstack/react-router", () => ({
	createFileRoute: () => (options: Record<string, unknown>) => ({
		...options,
	}),
	Link: ({
		to,
		params,
		children,
	}: {
		to: string;
		params?: Record<string, string>;
		children: React.ReactNode;
	}) => (
		<a
			data-testid="router-link"
			data-to={to}
			data-params={params ? JSON.stringify(params) : undefined}
			href={to}
		>
			{children}
		</a>
	),
}));

vi.mock("@/stores/dialogStore", () => ({
	useDialogStore: (selector: (state: Record<string, unknown>) => unknown) =>
		selector({ openDialog: vi.fn() }),
}));

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Home route (index.tsx)", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("exports a Route object", async () => {
		const indexModule = await import("@/routes/index");
		expect(indexModule.Route).toBeDefined();
	});

	describe("Home component", () => {
		it("renders the signed-in welcome heading", async () => {
			const indexModule = await import("@/routes/index");
			const HomeComponent = indexModule.Route.component;
			if (!HomeComponent) throw new Error("component not defined");

			render(<HomeComponent />);
			expect(
				screen.getByText("Welcome to Stakeholder AI Chat"),
			).toBeInTheDocument();
		});

		it("renders signed-in descriptive paragraph text", async () => {
			const indexModule = await import("@/routes/index");
			const HomeComponent = indexModule.Route.component;
			if (!HomeComponent) throw new Error("component not defined");

			render(<HomeComponent />);
			expect(
				screen.getByText(/your conversations are waiting/i),
			).toBeInTheDocument();
		});

		it("renders New Conversation button within SignedIn guard", async () => {
			const indexModule = await import("@/routes/index");
			const HomeComponent = indexModule.Route.component;
			if (!HomeComponent) throw new Error("component not defined");

			render(<HomeComponent />);

			const signedInBlock = screen.getByTestId("signed-in");
			const button = screen.getByRole("button", { name: /new conversation/i });
			expect(signedInBlock).toContainElement(button);
		});

		it("uses SignedIn and SignedOut components for auth gating", async () => {
			const indexModule = await import("@/routes/index");
			const HomeComponent = indexModule.Route.component;
			if (!HomeComponent) throw new Error("component not defined");

			render(<HomeComponent />);
			expect(mockSignedIn).toHaveBeenCalled();
			expect(mockSignedOut).toHaveBeenCalled();
		});

		it("renders the 'New Conversation' CTA button", async () => {
			const indexModule = await import("@/routes/index");
			const HomeComponent = indexModule.Route.component;
			if (!HomeComponent) throw new Error("component not defined");

			render(<HomeComponent />);
			expect(
				screen.getByRole("button", { name: /new conversation/i }),
			).toBeInTheDocument();
		});

		it("renders the logged-out hero headline", async () => {
			const indexModule = await import("@/routes/index");
			const HomeComponent = indexModule.Route.component;
			if (!HomeComponent) throw new Error("component not defined");

			render(<HomeComponent />);
			expect(
				screen.getByText(/practice with an ai stakeholder/i),
			).toBeInTheDocument();
		});

		it("renders the sign-in CTA link inside the SignedOut guard", async () => {
			const indexModule = await import("@/routes/index");
			const HomeComponent = indexModule.Route.component;
			if (!HomeComponent) throw new Error("component not defined");

			render(<HomeComponent />);

			const signedOutBlock = screen.getByTestId("signed-out");
			const button = screen.getByRole("button", {
				name: /sign in to get started/i,
			});
			expect(signedOutBlock).toContainElement(button);

			const link = button.closest("a");
			expect(link).not.toBeNull();
			expect(link).toHaveAttribute("data-to", "/auth/$pathname");
			expect(link).toHaveAttribute(
				"data-params",
				JSON.stringify({ pathname: "sign-in" }),
			);
		});

		it("renders the academic-use footer note for signed-out users", async () => {
			const indexModule = await import("@/routes/index");
			const HomeComponent = indexModule.Route.component;
			if (!HomeComponent) throw new Error("component not defined");

			render(<HomeComponent />);
			const signedOutBlock = screen.getByTestId("signed-out");
			const note = screen.getByText(/learning tool for academic use/i);
			expect(signedOutBlock).toContainElement(note);
		});
	});
});
