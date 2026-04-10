import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

const mockSignedIn = vi.fn();
const mockRedirectToSignIn = vi.fn();

vi.mock("@neondatabase/neon-js/auth/react/ui", () => ({
	SignedIn: ({ children }: { children: React.ReactNode }) => {
		mockSignedIn();
		return <div data-testid="signed-in">{children}</div>;
	},
	RedirectToSignIn: () => {
		mockRedirectToSignIn();
		return <div data-testid="redirect-to-sign-in" />;
	},
}));

vi.mock("@tanstack/react-router", () => ({
	createFileRoute: () => (options: Record<string, unknown>) => ({
		...options,
	}),
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
		it("renders the welcome heading", async () => {
			const indexModule = await import("@/routes/index");
			const HomeComponent = indexModule.Route.component;
			if (!HomeComponent) throw new Error("component not defined");

			render(<HomeComponent />);
			expect(
				screen.getByText("Welcome to Stakeholder AI Chat"),
			).toBeInTheDocument();
		});

		it("renders descriptive paragraph text", async () => {
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

		it("uses SignedIn component for auth gating", async () => {
			const indexModule = await import("@/routes/index");
			const HomeComponent = indexModule.Route.component;
			if (!HomeComponent) throw new Error("component not defined");

			render(<HomeComponent />);
			expect(mockSignedIn).toHaveBeenCalled();
		});

		it("renders RedirectToSignIn for unauthenticated users", async () => {
			const indexModule = await import("@/routes/index");
			const HomeComponent = indexModule.Route.component;
			if (!HomeComponent) throw new Error("component not defined");

			render(<HomeComponent />);
			expect(mockRedirectToSignIn).toHaveBeenCalled();
			expect(screen.getByTestId("redirect-to-sign-in")).toBeInTheDocument();
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
	});
});
