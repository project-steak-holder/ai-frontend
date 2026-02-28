import { test as setup } from "@playwright/test";
import { neon } from "@neondatabase/serverless";

setup("cleanup test data", async () => {
	const sql = neon(process.env.DATABASE_URL!);
	await sql`
		DELETE FROM message WHERE conversation_id IN (
			SELECT id FROM conversation WHERE user_id = (
				SELECT id FROM neon_auth.user WHERE email = ${process.env.E2E_TEST_EMAIL}
			)
		)
	`;
	await sql`
		DELETE FROM conversation WHERE user_id = (
			SELECT id FROM neon_auth.user WHERE email = ${process.env.E2E_TEST_EMAIL}
		)
	`;
});
