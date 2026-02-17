import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CapturedError } from "@/components/error-handling/types";
import { useErrorLogger } from "../useErrorLogger";

describe("useErrorLogger", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("logs error to console in development", () => {
		const consoleErrorSpy = vi
			.spyOn(console, "error")
			.mockImplementation(() => {});

		const error: CapturedError = {
			message: "Test error",
			stack: "Error: Test error\n  at Component",
			componentStack: "  in Component",
			boundaryName: "RootErrorBoundary",
			timestamp: new Date(),
			userAgent: "test",
			environment: "development",
		};

		renderHook(() => useErrorLogger(error));

		expect(consoleErrorSpy).toHaveBeenCalledWith("[Error Boundary]", error);

		consoleErrorSpy.mockRestore();
	});

	it("stores error in sessionStorage in development", () => {
		const setItemSpy = vi.spyOn(Storage.prototype, "setItem");

		const error: CapturedError = {
			message: "Test error",
			stack: "Error: Test error",
			componentStack: "  in Component",
			boundaryName: "RootErrorBoundary",
			timestamp: new Date(),
			userAgent: "test",
			environment: "development",
		};

		renderHook(() => useErrorLogger(error));

		expect(setItemSpy).toHaveBeenCalledWith("lastError", JSON.stringify(error));

		setItemSpy.mockRestore();
	});

	it("does not store in sessionStorage in production", () => {
		const setItemSpy = vi.spyOn(Storage.prototype, "setItem");

		const error: CapturedError = {
			message: "Test error",
			stack: "Error: Test error",
			componentStack: "  in Component",
			boundaryName: "RootErrorBoundary",
			timestamp: new Date(),
			userAgent: "test",
			environment: "production",
		};

		renderHook(() => useErrorLogger(error));

		expect(setItemSpy).not.toHaveBeenCalled();

		setItemSpy.mockRestore();
	});
});
