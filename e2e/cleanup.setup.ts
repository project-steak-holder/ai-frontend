import { test as setup, expect } from "@playwright/test";
import { neon } from "@neondatabase/serverless";

setup("cleanup test data", async () => {
	const email = process.env.E2E_TEST_EMAIL;
	const databaseUrl = process.env.DATABASE_URL;

	expect(email, "E2E_TEST_EMAIL must be set").toBeTruthy();
	expect(databaseUrl, "DATABASE_URL must be set").toBeTruthy();

	const sql = neon(databaseUrl!);

	// Find the test user
	const users = await sql`
		SELECT id FROM neon_auth."user" WHERE email = ${email}
	`;
	if (users.length === 0) {
		console.log(`No user found with email: ${email}, skipping cleanup`);
		return;
	}
	const userId = users[0].id;
	console.log(`Cleaning up data for user ${userId} (${email})`);

	// Delete messages first (FK constraint)
	const deletedMessages = await sql`
		DELETE FROM message
		WHERE conversation_id IN (
			SELECT id FROM conversation WHERE user_id = ${userId}
		)
		RETURNING id
	`;
	console.log(`Deleted ${deletedMessages.length} messages`);

	// Delete conversations
	const deletedConversations = await sql`
		DELETE FROM conversation WHERE user_id = ${userId}
		RETURNING id
	`;
	console.log(`Deleted ${deletedConversations.length} conversations`);
});
