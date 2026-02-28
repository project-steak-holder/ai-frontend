/**
 * Ensures the barrel re-export file (index.ts) is included in coverage
 * by importing from it.
 */
import { describe, expect, it, vi } from "vitest";

vi.mock("@/integrations/neon-auth/client", () => ({
	authClient: {
		useSession: vi.fn().mockReturnValue({ data: { user: { id: "user-1" } } }),
		getSession: vi.fn(),
	},
}));

vi.mock("@server/api/messages", () => ({
	getMessagesByConversationId: vi.fn(),
	sendMessage: vi.fn(),
}));

vi.mock("sonner", () => ({
	toast: { error: vi.fn(), success: vi.fn() },
}));

describe("messages hooks barrel export", () => {
	it("exports all expected hooks", async () => {
		const mod = await import("../index");
		expect(typeof mod.useMessagesByConversationId).toBe("function");
		expect(typeof mod.useSendMessage).toBe("function");
	});
});
