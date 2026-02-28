/**
 * Ensures the barrel re-export file (index.ts) is included in coverage by importing from it.
 */
import { describe, expect, it } from "vitest";
import * as errorHandling from "../index";

describe("error-handling barrel export", () => {
	it("exports ErrorFallback", () => {
		expect(typeof errorHandling.ErrorFallback).toBe("function");
	});

	it("exports ErrorOverlay", () => {
		expect(typeof errorHandling.ErrorOverlay).toBe("function");
	});

	it("exports RootErrorBoundary", () => {
		expect(typeof errorHandling.RootErrorBoundary).toBe("function");
	});

	it("exports RouteErrorBoundary", () => {
		expect(typeof errorHandling.RouteErrorBoundary).toBe("function");
	});
});
