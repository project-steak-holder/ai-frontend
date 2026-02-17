import { createAuthClient } from "@neondatabase/neon-js/auth";
import { getRequest } from "@tanstack/react-start/server";
import { env } from "@/env";

const serverAuthClient = createAuthClient(env.VITE_NEON_AUTH_URL);

function getRequestHeaders(request: Request): Record<string, string> {
	return Object.fromEntries(request.headers.entries());
}

/**
 * This is a server side helper to getServerSession
 * @param request - The incoming request
 * @returns The session object
 */
export async function getServerSession(request = getRequest()) {
	return serverAuthClient.getSession({
		fetchOptions: {
			headers: getRequestHeaders(request),
		},
	});
}
