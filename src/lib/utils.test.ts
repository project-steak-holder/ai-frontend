// src/lib/utils.test.ts
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { cn, guard } from "./utils";

describe("cn", () => {
	it("merges class names", () => {
		expect(cn("foo", "bar")).toBe("foo bar");
	});

	it("deduplicates tailwind classes (last wins)", () => {
		expect(cn("p-2", "p-4")).toBe("p-4");
	});

	it("handles conditional classes", () => {
		expect(cn("base", false && "skipped", "included")).toBe("base included");
	});
});

describe("guard", () => {
	it("returns value when it is not null or undefined", () => {
		expect(guard("hello")).toBe("hello");
		expect(guard(0)).toBe(0);
		expect(guard(false)).toBe(false);
	});

	it("throws with default message when value is null", () => {
		expect(() => guard(null)).toThrow("Value is required");
	});

	it("throws with default message when value is undefined", () => {
		expect(() => guard(undefined)).toThrow("Value is required");
	});

	it("throws with custom message when value is null", () => {
		expect(() => guard(null, "must be signed in")).toThrow("must be signed in");
	});

	it("throws with custom message when value is undefined", () => {
		expect(() => guard(undefined, "must be signed in")).toThrow(
			"must be signed in",
		);
	});

	it("validates and returns when schema passes", () => {
		const schema = z.string().email();
		const result = guard("user@example.com", schema);
		expect(result).toBe("user@example.com");
	});

	it("throws with error message when schema fails", () => {
		const schema = z.string().email();
		expect(() => guard("not-an-email", schema, "invalid email")).toThrow(
			"invalid email",
		);
	});

	it("throws with default error message when schema fails and no message given", () => {
		const schema = z.string().email();
		expect(() => guard("not-an-email", schema)).toThrow("Value is required");
	});
});
