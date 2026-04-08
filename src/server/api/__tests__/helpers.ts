/**
 * Shared test helpers for server function tests.
 *
 * Provides a mock for `createServerFn` that executes the Zod validator and
 * handler synchronously (no HTTP layer), and a chainable Drizzle query-builder
 * mock factory.
 */
import { type Mock, vi } from "vitest";

// ---------------------------------------------------------------------------
// createServerFn mock
// ---------------------------------------------------------------------------

/**
 * Call this in a `vi.mock("@tanstack/react-start", ...)` factory.
 * It returns a builder whose final `.handler()` call produces an async
 * function: `(input) => handler({ data: validatedInput })`.
 */
export function mockCreateServerFn() {
	return (_opts?: { method?: string }) => {
		let validator: { parse: (v: unknown) => unknown } | undefined;

		const chain = {
			inputValidator(schema: { parse: (v: unknown) => unknown }) {
				validator = schema;
				return chain;
			},
			handler(fn: (ctx: { data: unknown }) => unknown) {
				const callable = async (input: unknown) => {
					const parsed = validator ? validator.parse(input) : input;
					return fn({ data: parsed });
				};
				return callable;
			},
		};
		return chain;
	};
}

// ---------------------------------------------------------------------------
// Drizzle query-builder chain mock
// ---------------------------------------------------------------------------

export interface ChainMock {
	insert: Mock;
	values: Mock;
	returning: Mock;
	select: Mock;
	from: Mock;
	where: Mock;
	orderBy: Mock;
	limit: Mock;
	update: Mock;
	set: Mock;
	/** Resolve the terminal operation (returning / limit / orderBy) with `data`. */
	resolveWith: (data: unknown) => void;
	/** Make the terminal operation reject with `error`. */
	rejectWith: (error: Error) => void;
}

/**
 * Build a mock that mimics Drizzle's chainable query builder.
 *
 * Every method returns the chain itself so `.insert().values().returning()`
 * works. Call `resolveWith(data)` **before** invoking the server function to
 * set what the final awaited value will be.
 */
export function createDbChainMock(): ChainMock {
	let terminalValue: Promise<unknown> = Promise.resolve([]);

	const chain: ChainMock = {
		insert: vi.fn(),
		values: vi.fn(),
		returning: vi.fn(),
		select: vi.fn(),
		from: vi.fn(),
		where: vi.fn(),
		orderBy: vi.fn(),
		limit: vi.fn(),
		update: vi.fn(),
		set: vi.fn(),

		resolveWith(data: unknown) {
			terminalValue = Promise.resolve(data);
		},
		rejectWith(error: Error) {
			terminalValue = Promise.reject(error);
		},
	};

	// Every method returns a Proxy that is both thenable (so `await` works)
	// and chainable (so `.from().where().limit()` works).
	const proxyHandler: ProxyHandler<object> = {
		get(_target, prop) {
			if (prop === "then") {
				return (
					resolve: (v: unknown) => void,
					reject: (e: unknown) => void,
				) => terminalValue.then(resolve, reject);
			}
			if (prop in chain) {
				return (...args: unknown[]) => {
					(chain as Record<string, Mock>)[prop as string](...args);
					return new Proxy({}, proxyHandler);
				};
			}
			return undefined;
		},
	};

	// Override each method to return the chainable proxy
	for (const key of [
		"insert",
		"values",
		"returning",
		"select",
		"from",
		"where",
		"orderBy",
		"limit",
		"update",
		"set",
	] as const) {
		chain[key] = vi.fn().mockImplementation(() => new Proxy({}, proxyHandler));
	}

	return chain;
}

// ---------------------------------------------------------------------------
// UUID helpers
// ---------------------------------------------------------------------------

/** Callable type for server functions returned by the mocked `createServerFn`. */
export type ServerFn = (input: unknown) => Promise<unknown>;

export const VALID_USER_ID = "00000000-0000-4000-8000-000000000001";
export const VALID_CONVERSATION_ID = "00000000-0000-4000-8000-000000000002";
export const OTHER_USER_ID = "00000000-0000-4000-8000-000000000099";
