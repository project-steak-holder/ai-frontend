// src/components/error-handling/__tests__/RouteErrorBoundary.test.tsx

import { render, screen } from "@testing-library/react";
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
});
