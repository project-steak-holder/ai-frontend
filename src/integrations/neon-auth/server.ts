import { createAuthClient } from "@neondatabase/neon-js/auth";
import { getRequest } from "@tanstack/react-start/server";
import { env } from "@/env";

const serverAuthClient = createAuthClient(env.VITE_NEON_AUTH_URL);

export async function getServerSession() {
	// Get the actual request object to access headers
	const request = getRequest();

	const cookieHeader = request.headers.get("cookie");
	const cookies = cookieHeader
		? cookieHeader.split(";").map((c) => c.trim().split("=")[0])
		: [];

	// Diagnostic logging to debug session issues
	console.log("getServerSession - headers check:", {
		hasCookie: !!cookieHeader,
		hasAuthorization: !!request.headers.get("authorization"),
		cookieNames: cookies,
		fullCookieHeader: cookieHeader,
		allHeaders: Array.from(request.headers.keys()),
	});

	const session = await serverAuthClient.getSession({
		fetchOptions: {
			headers: request.headers,
		},
	});

	return session;
}
