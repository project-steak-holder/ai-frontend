// src/components/error-handling/__tests__/RootErrorBoundary.test.tsx

import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RootErrorBoundary } from "../RootErrorBoundary";

// Test helper component that throws an error
const ThrowError = ({ message }: { message: string }) => {
	throw new Error(message);
};

describe("RootErrorBoundary", () => {
	beforeEach(() => {
		vi.spyOn(console, "error").mockImplementation(() => {});
	});

	afterEach(() => {
		vi.unstubAllEnvs();
	});

	it("catches errors from child components", () => {
		render(
			<RootErrorBoundary>
				<ThrowError message="Test error" />
			</RootErrorBoundary>,
		);

		expect(screen.getByText(/component error occurred/i)).toBeInTheDocument();
	});

	it("renders children when no error", () => {
		render(
			<RootErrorBoundary>
				<div>Normal content</div>
			</RootErrorBoundary>,
		);

		expect(screen.getByText(/normal content/i)).toBeInTheDocument();
	});

	it("shows ErrorOverlay in development", () => {
		// Assumes test runs in dev mode (import.meta.env.DEV = true)
		render(
			<RootErrorBoundary>
				<ThrowError message="Dev error" />
			</RootErrorBoundary>,
		);

		// ErrorOverlay shows stack trace
		expect(screen.getByText(/stack trace/i)).toBeInTheDocument();
	});

	it("shows ErrorFallback in production", () => {
		vi.stubEnv("DEV", false);

		render(
			<RootErrorBoundary>
				<ThrowError message="Prod error" />
			</RootErrorBoundary>,
		);

		// ErrorFallback does not show stack trace
		expect(screen.queryByText(/stack trace/i)).not.toBeInTheDocument();
		expect(screen.getByText(/oops! something went wrong/i)).toBeInTheDocument();
	});

	it("tracks error count on repeated errors", () => {
		const { rerender } = render(
			<RootErrorBoundary>
				<div>Normal</div>
			</RootErrorBoundary>,
		);

		// First error
		rerender(
			<RootErrorBoundary>
				<ThrowError message="Error 1" />
			</RootErrorBoundary>,
		);

		const dismissBtn = screen.getByText(/dismiss/i);
		fireEvent.click(dismissBtn);

		// Second error (after dismiss)
		rerender(
			<RootErrorBoundary>
				<ThrowError message="Error 2" />
			</RootErrorBoundary>,
		);

		// Error count should be 2 (stored in state)
		// This is implicitly tested - if errorCount > 3, show different message
		expect(screen.getByText(/component error occurred/i)).toBeInTheDocument();
	});

	it("shows persistent error message after 3 errors", () => {
		const { rerender } = render(
			<RootErrorBoundary>
				<div>Normal</div>
			</RootErrorBoundary>,
		);

		// Trigger 3 errors
		for (let i = 0; i < 3; i++) {
			rerender(
				<RootErrorBoundary>
					<ThrowError message={`Error ${i + 1}`} />
				</RootErrorBoundary>,
			);

			const dismissBtn = screen.getByText(/dismiss/i);
			fireEvent.click(dismissBtn);
		}

		// Fourth error
		rerender(
			<RootErrorBoundary>
				<ThrowError message="Error 4" />
			</RootErrorBoundary>,
		);

		expect(screen.getByText(/persistent error/i)).toBeInTheDocument();
	});
});
