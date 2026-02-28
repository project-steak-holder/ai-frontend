/**
 * Ensures the barrel re-export file (index.ts) is included in coverage.
 * The schema barrel just re-exports Conversation types, so we verify
 * that the named exports are present at runtime.
 */
import { describe, expect, it } from "vitest";

describe("lib/schema barrel export (index.ts)", () => {
	it("re-exports Conversation table and types", async () => {
		const mod = await import("../index");
		// The Conversation table is exported as a drizzle table object
		expect(mod.Conversation).toBeDefined();
	});
});

describe("lib/schema runtime barrel export (runtime.ts)", () => {
	it("re-exports all schema items", async () => {
		const mod = await import("../runtime");
		expect(mod.Conversation).toBeDefined();
		expect(mod.Message).toBeDefined();
		expect(mod.User).toBeDefined();
	});
});
