import { definePlugin } from "nitro";
import { env } from "@/env";

const isDev = env.NODE_ENV !== "production";

const SECURITY_HEADERS: Record<string, string> = {
	"X-Content-Type-Options": "nosniff",
	"X-Frame-Options": "DENY",
	"X-XSS-Protection": "0",
	"Referrer-Policy": "strict-origin-when-cross-origin",
	"Strict-Transport-Security": "max-age=31536000; includeSubDomains",
	"Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=()",
	"Cross-Origin-Opener-Policy": "same-origin",
	"Cross-Origin-Resource-Policy": "same-origin",
	[isDev ? "Content-Security-Policy-Report-Only" : "Content-Security-Policy"]: [
		"default-src 'self'",
		`script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
		"style-src 'self' 'unsafe-inline'",
		"img-src 'self' data: blob: https://*.googleusercontent.com",
		"font-src 'self' data: https://fonts.gstatic.com https://www.slant.co",
		"connect-src 'self' https://*.neon.tech https://accounts.google.com",
		"frame-src 'self' https://accounts.google.com",
		"frame-ancestors 'none'",
		"base-uri 'self'",
		"form-action 'self' https://accounts.google.com",
		"object-src 'none'",
	].join("; "),
};

export default definePlugin((nitroApp) => {
	nitroApp.hooks.hook("response", (res: Response) => {
		for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
			res.headers.set(key, value);
		}
	});
});
