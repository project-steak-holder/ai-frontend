// src/components/error-handling/__tests__/integration.test.tsx

import {
	cleanup,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RootErrorBoundary } from "../RootErrorBoundary";

const ThrowError = ({ message }: { message: string }) => {
	throw new Error(message);
};

describe("Error Handling Integration", () => {
	beforeEach(() => {
		vi.spyOn(console, "error").mockImplementation(() => {});
	});

	afterEach(() => {
		cleanup();
		vi.restoreAllMocks();
	});

	it("complete error flow: catch -> display error UI", async () => {
		render(
			<RootErrorBoundary>
				<ThrowError message="Test error" />
			</RootErrorBoundary>,
		);

		// Error caught and displayed
		await waitFor(() => {
			expect(screen.getByText(/component error occurred/i)).toBeInTheDocument();
		});
		expect(screen.getAllByText(/test error/i)[0]).toBeInTheDocument();

		// Verify all error UI elements are present
		expect(
			screen.getByRole("button", { name: /dismiss/i }),
		).toBeInTheDocument();
		expect(screen.getByRole("button", { name: /copy/i })).toBeInTheDocument();
		expect(screen.getByRole("button", { name: /reload/i })).toBeInTheDocument();
	});

	it("copy functionality includes all error details", async () => {
		const originalClipboard = navigator.clipboard;
		const writeTextMock = vi.fn().mockResolvedValue(undefined);
		Object.assign(navigator, {
			clipboard: {
				writeText: writeTextMock,
			},
		});

		try {
			render(
				<RootErrorBoundary>
					<ThrowError message="Detailed error" />
				</RootErrorBoundary>,
			);

			await waitFor(() => {
				expect(
					screen.getByText(/component error occurred/i),
				).toBeInTheDocument();
			});

			const copyBtn = screen.getByRole("button", { name: /copy/i });
			fireEvent.click(copyBtn);

			await waitFor(() => {
				expect(writeTextMock).toHaveBeenCalled();
				const copiedText = writeTextMock.mock.calls[0][0];
				expect(copiedText).toContain("Detailed error");
				expect(copiedText).toContain("Stack");
			});
		} finally {
			Object.assign(navigator, {
				clipboard: originalClipboard,
			});
		}
	});

	it("reload button triggers window reload", async () => {
		const reloadMock = vi.fn();
		const originalLocation = window.location;

		// Mock window.location with reload
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-expect-error - Mocking window.location for testing
		delete window.location;
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-expect-error - Mocking window.location for testing
		window.location = { ...originalLocation, reload: reloadMock };

		render(
			<RootErrorBoundary>
				<ThrowError message="Reload test" />
			</RootErrorBoundary>,
		);

		await waitFor(() => {
			expect(screen.getByText(/component error occurred/i)).toBeInTheDocument();
		});

		const reloadBtn = screen.getByRole("button", { name: /reload/i });
		fireEvent.click(reloadBtn);

		expect(reloadMock).toHaveBeenCalled();

		// Restore original location
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-expect-error - Restoring window.location after testing
		window.location = originalLocation;
	});
});
