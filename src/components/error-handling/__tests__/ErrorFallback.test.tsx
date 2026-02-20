// src/components/error-handling/__tests__/ErrorFallback.test.tsx

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ErrorFallback } from "../ErrorFallback";

describe("ErrorFallback", () => {
	const mockError = new Error("Test error");
	const mockProps = {
		error: mockError,
		boundaryName: "RootErrorBoundary",
		timestamp: new Date(),
		onDismiss: vi.fn(),
		onReload: vi.fn(),
	};

	it("renders error title", () => {
		render(<ErrorFallback {...mockProps} />);
		expect(screen.getByText(/oops! something went wrong/i)).toBeInTheDocument();
	});

	it("does not show stack trace", () => {
		render(<ErrorFallback {...mockProps} />);
		expect(screen.queryByText(/test error/i)).not.toBeInTheDocument();
	});

	it("renders Go to Home and Refresh buttons", () => {
		render(<ErrorFallback {...mockProps} />);
		expect(screen.getByText(/go to home/i)).toBeInTheDocument();
		expect(screen.getByText(/refresh page/i)).toBeInTheDocument();
	});

	it("calls onReload when Refresh button clicked", () => {
		render(<ErrorFallback {...mockProps} />);
		const reloadButton = screen.getByText(/refresh page/i);
		fireEvent.click(reloadButton);
		expect(mockProps.onReload).toHaveBeenCalledOnce();
	});

	it("shows contextual message for route errors", () => {
		render(<ErrorFallback {...mockProps} boundaryName="RouteErrorBoundary" />);
		expect(screen.getByText(/we couldn't load this page/i)).toBeInTheDocument();
	});

	it("shows different message for root errors", () => {
		render(<ErrorFallback {...mockProps} boundaryName="RootErrorBoundary" />);
		expect(
			screen.getByText(/the application encountered an unexpected error/i),
		).toBeInTheDocument();
	});
});
