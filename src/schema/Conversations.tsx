import { pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

export const Conversations = pgTable("conversations", {
	id: uuid("id").primaryKey().defaultRandom(),
	userId: uuid("user_id").notNull(),
	name: varchar("name", { length: 255 }).notNull(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Conversation = typeof Conversations.$inferSelect;
export type NewConversation = typeof Conversations.$inferInsert;
export type UpdateConversation = Partial<NewConversation>;
