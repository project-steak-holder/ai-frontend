import { userInNeonAuth } from "@drizzle/auth/schema";
import { pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

/** Table */
export const Conversations = pgTable("conversation", {
	id: uuid("id").primaryKey().defaultRandom(),
	userId: uuid("user_id")
		.notNull()
		.references(() => userInNeonAuth.id, { onDelete: "cascade" }),
	name: varchar("name", { length: 255 }).notNull(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/** Types */
export type Conversation = typeof Conversations.$inferSelect;
export type NewConversation = typeof Conversations.$inferInsert;
export type UpdateConversation = Partial<NewConversation>;
