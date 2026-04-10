import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

vi.mock("@/env", () => ({
	env: { NODE_ENV: "production" },
}));

vi.mock("nitro", () => ({
	definePlugin: (fn: (app: unknown) => void) => {
		return fn;
	},
}));

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("security-headers plugin", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("registers a response hook that sets security headers", async () => {
		const plugin = (await import("../security-headers")).default;

		const hookCallbacks: Record<string, (res: unknown) => void> = {};
		const nitroApp = {
			hooks: {
				hook: (event: string, callback: (res: unknown) => void) => {
					hookCallbacks[event] = callback;
				},
			},
		};

		plugin(nitroApp);

		expect(hookCallbacks.response).toBeDefined();

		const headers = new Headers();
		const mockResponse = { headers };

		hookCallbacks.response(mockResponse);

		expect(headers.get("X-Content-Type-Options")).toBe("nosniff");
		expect(headers.get("X-Frame-Options")).toBe("DENY");
		expect(headers.get("X-XSS-Protection")).toBe("0");
		expect(headers.get("Referrer-Policy")).toBe(
			"strict-origin-when-cross-origin",
		);
		expect(headers.get("Strict-Transport-Security")).toBe(
			"max-age=31536000; includeSubDomains",
		);
		expect(headers.get("Permissions-Policy")).toBe(
			"camera=(), microphone=(), geolocation=(), payment=()",
		);
		expect(headers.get("Cross-Origin-Opener-Policy")).toBe("same-origin");
		expect(headers.get("Cross-Origin-Resource-Policy")).toBe("same-origin");
	});

	it("sets Content-Security-Policy header in production", async () => {
		const plugin = (await import("../security-headers")).default;

		const hookCallbacks: Record<string, (res: unknown) => void> = {};
		const nitroApp = {
			hooks: {
				hook: (event: string, callback: (res: unknown) => void) => {
					hookCallbacks[event] = callback;
				},
			},
		};

		plugin(nitroApp);

		const headers = new Headers();
		hookCallbacks.response({ headers });

		expect(headers.get("Content-Security-Policy")).toBeTruthy();
		expect(headers.get("Content-Security-Policy-Report-Only")).toBeNull();

		const csp = headers.get("Content-Security-Policy") as string;
		expect(csp).toContain("default-src 'self'");
		expect(csp).toContain("frame-ancestors 'none'");
		expect(csp).toContain("object-src 'none'");
		expect(csp).not.toContain("'unsafe-eval'");
	});
});

describe("security-headers plugin (development)", () => {
	beforeEach(() => {
		vi.resetModules();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("uses Content-Security-Policy-Report-Only in development", async () => {
		vi.doMock("@/env", () => ({
			env: { NODE_ENV: "development" },
		}));

		const plugin = (await import("../security-headers")).default;

		const hookCallbacks: Record<string, (res: unknown) => void> = {};
		const nitroApp = {
			hooks: {
				hook: (event: string, callback: (res: unknown) => void) => {
					hookCallbacks[event] = callback;
				},
			},
		};

		plugin(nitroApp);

		const headers = new Headers();
		hookCallbacks.response({ headers });

		expect(headers.get("Content-Security-Policy-Report-Only")).toBeTruthy();

		const csp = headers.get("Content-Security-Policy-Report-Only") as string;
		expect(csp).toContain("'unsafe-eval'");
	});
});
