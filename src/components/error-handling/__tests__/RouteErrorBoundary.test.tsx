// src/components/error-handling/__tests__/RouteErrorBoundary.test.tsx

import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RouteErrorBoundary } from "../RouteErrorBoundary";

// Mock TanStack Router
const mockInvalidate = vi.fn();
vi.mock("@tanstack/react-router", () => ({
	useRouter: () => ({
		invalidate: mockInvalidate,
	}),
}));

describe("RouteErrorBoundary", () => {
	const mockError = new Error("Route error");

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("renders ErrorOverlay in development", () => {
		render(<RouteErrorBoundary error={mockError} />);
		expect(screen.getByText(/component error occurred/i)).toBeInTheDocument();
	});

	it("displays the error message", () => {
		render(<RouteErrorBoundary error={mockError} />);
		// The error message appears in the alert - use getAllByText and check the first one
		const errorMessages = screen.getAllByText(/route error/i);
		expect(errorMessages.length).toBeGreaterThan(0);
	});

	it("shows route-specific context", () => {
		render(<RouteErrorBoundary error={mockError} />);
		// The boundary name appears in multiple places (location and stack)
		const boundaryReferences = screen.getAllByText(/routeerror/i);
		expect(boundaryReferences.length).toBeGreaterThan(0);
	});

	it("calls router.invalidate when dismiss is triggered", () => {
		render(<RouteErrorBoundary error={mockError} />);
		// In dev mode, ErrorOverlay has a dismiss button
		const dismissButton = screen.getByRole("button", { name: /dismiss/i });
		fireEvent.click(dismissButton);
		expect(mockInvalidate).toHaveBeenCalled();
	});

	it("copies error details to clipboard when copy button is clicked", async () => {
		const writeText = vi.fn().mockResolvedValue(undefined);
		Object.assign(navigator, {
			clipboard: { writeText },
		});

		const error = new Error("Copy test error");
		error.stack = "Error: Copy test error\n  at test.ts:1:1";

		render(<RouteErrorBoundary error={error} />);

		const copyButton = screen.getByRole("button", { name: /copy/i });
		fireEvent.click(copyButton);

		expect(writeText).toHaveBeenCalledWith(
			expect.stringContaining("Copy test error"),
		);
	});

	it("handles clipboard API unavailability gracefully", () => {
		const originalClipboard = navigator.clipboard;
		Object.defineProperty(navigator, "clipboard", {
			value: undefined,
			writable: true,
			configurable: true,
		});

		render(<RouteErrorBoundary error={mockError} />);

		const copyButton = screen.getByRole("button", { name: /copy/i });
		// Should not throw
		expect(() => fireEvent.click(copyButton)).not.toThrow();

		Object.defineProperty(navigator, "clipboard", {
			value: originalClipboard,
			writable: true,
			configurable: true,
		});
	});

	it("calls window.location.reload when reload is triggered", () => {
		const reloadMock = vi.fn();
		Object.defineProperty(window, "location", {
			value: { ...window.location, reload: reloadMock, pathname: "/" },
			writable: true,
			configurable: true,
		});

		render(<RouteErrorBoundary error={mockError} />);

		const reloadButton = screen.getByRole("button", { name: /reload/i });
		fireEvent.click(reloadButton);

		expect(reloadMock).toHaveBeenCalled();
	});
});
