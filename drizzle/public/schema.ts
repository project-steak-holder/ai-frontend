import { pgTable, foreignKey, uuid, varchar, timestamp, index, text, pgEnum } from "drizzle-orm/pg-core"
import { userInNeonAuth } from "@drizzle/auth/schema";

export const messagetype = pgEnum("messagetype", ['USER', 'AI'])


export const conversation = pgTable("conversation", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	name: varchar({ length: 255 }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [userInNeonAuth.id],
			name: "conversation_user_id_user_id_fk"
		}).onDelete("cascade"),
]);

export const alembicVersion = pgTable("alembic_version", {
	versionNum: varchar("version_num", { length: 32 }).primaryKey().notNull(),
});

export const message = pgTable("message", {
	id: uuid().primaryKey().notNull(),
	conversationId: uuid("conversation_id").notNull(),
	userId: uuid("user_id").notNull(),
	content: text().notNull(),
	type: messagetype().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).notNull(),
}, (table) => [
	index("ix_message_conversation_created_at").using("btree", table.conversationId.asc().nullsLast().op("timestamptz_ops"), table.createdAt.asc().nullsLast().op("timestamptz_ops")),
	foreignKey({
			columns: [table.conversationId],
			foreignColumns: [conversation.id],
			name: "message_conversation_id_fkey"
		}),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [userInNeonAuth.id],
			name: "message_user_id_fkey"
		}),
]);
