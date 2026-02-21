// src/components/error-handling/__tests__/ErrorOverlay.test.tsx

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ErrorOverlay } from "../ErrorOverlay";

describe("ErrorOverlay", () => {
	const mockError = new Error("Test error message");
	mockError.stack = "Error: Test error message\n  at Component (file.tsx:10:5)";

	const mockErrorInfo = {
		componentStack: "  in Component\n  in App",
	};

	const mockProps = {
		error: mockError,
		errorInfo: mockErrorInfo,
		boundaryName: "RootErrorBoundary",
		route: "/test",
		timestamp: new Date("2026-02-17T10:30:00"),
		onDismiss: vi.fn(),
		onCopy: vi.fn(),
		onReload: vi.fn(),
	};

	it("renders error title", () => {
		render(<ErrorOverlay {...mockProps} />);
		expect(screen.getByText(/component error occurred/i)).toBeInTheDocument();
	});

	it("displays error message", () => {
		render(<ErrorOverlay {...mockProps} />);
		expect(screen.getAllByText(/test error message/i)[0]).toBeInTheDocument();
	});

	it("shows all action buttons", () => {
		render(<ErrorOverlay {...mockProps} />);
		expect(screen.getByText(/dismiss/i)).toBeInTheDocument();
		expect(screen.getByText(/copy/i)).toBeInTheDocument();
		expect(screen.getByText(/reload/i)).toBeInTheDocument();
	});

	it("displays error metadata", () => {
		render(<ErrorOverlay {...mockProps} />);
		expect(screen.getByText(/location:/i)).toBeInTheDocument();
		expect(screen.getByText(/rooterrorbound.*\/test/i)).toBeInTheDocument();
		expect(screen.getByText(/time:/i)).toBeInTheDocument();
	});

	it("displays component stack", () => {
		render(<ErrorOverlay {...mockProps} />);
		expect(screen.getByText(/component stack/i)).toBeInTheDocument();
		expect(screen.getByText(/in component/i)).toBeInTheDocument();
	});

	it("displays stack trace", () => {
		render(<ErrorOverlay {...mockProps} />);
		expect(screen.getByText(/stack trace/i)).toBeInTheDocument();
		expect(screen.getByText(/at component.*file\.tsx/i)).toBeInTheDocument();
	});

	it("calls onDismiss when Dismiss clicked", () => {
		render(<ErrorOverlay {...mockProps} />);
		const dismissBtn = screen.getByText(/dismiss/i);
		fireEvent.click(dismissBtn);
		expect(mockProps.onDismiss).toHaveBeenCalledOnce();
	});

	it("calls onReload when Reload clicked", () => {
		render(<ErrorOverlay {...mockProps} />);
		const reloadBtn = screen.getByText(/reload/i);
		fireEvent.click(reloadBtn);
		expect(mockProps.onReload).toHaveBeenCalledOnce();
	});

	it("calls onCopy when Copy clicked", () => {
		render(<ErrorOverlay {...mockProps} />);
		const copyBtn = screen.getByText(/copy/i);
		fireEvent.click(copyBtn);
		expect(mockProps.onCopy).toHaveBeenCalledOnce();
	});
});
