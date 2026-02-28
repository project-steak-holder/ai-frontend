/**
 * Ensures the barrel re-export file is included in coverage by importing from it.
 */
import { describe, expect, it, vi } from "vitest";

vi.mock("@/integrations/neon-auth/client", () => ({
	authClient: {
		useSession: vi.fn().mockReturnValue({ data: { user: { id: "user-1" } } }),
	},
}));

vi.mock("@server/api/conversations", () => ({
	getConversations: vi.fn(),
	getConversationById: vi.fn(),
	createConversation: vi.fn(),
	updateConversation: vi.fn(),
}));

vi.mock("@tanstack/react-router", () => ({
	useNavigate: vi.fn().mockReturnValue(vi.fn()),
}));

vi.mock("sonner", () => ({
	toast: { error: vi.fn(), success: vi.fn() },
}));

describe("conversations hooks barrel export", () => {
	it("exports all expected hooks", async () => {
		const mod = await import("../index");
		expect(typeof mod.useConversation).toBe("function");
		expect(typeof mod.useConversations).toBe("function");
		expect(typeof mod.useCreateConversation).toBe("function");
		expect(typeof mod.useUpdateConversation).toBe("function");
	});
});
