import { relations } from "drizzle-orm/relations";
import { userInNeonAuth, conversation, message } from "./schema";

export const conversationRelations = relations(conversation, ({one, many}) => ({
	userInNeonAuth: one(userInNeonAuth, {
		fields: [conversation.userId],
		references: [userInNeonAuth.id]
	}),
	messages: many(message),
}));

export const userInNeonAuthRelations = relations(userInNeonAuth, ({many}) => ({
	conversations: many(conversation),
	messages: many(message),
}));

export const messageRelations = relations(message, ({one}) => ({
	conversation: one(conversation, {
		fields: [message.conversationId],
		references: [conversation.id]
	}),
	userInNeonAuth: one(userInNeonAuth, {
		fields: [message.userId],
		references: [userInNeonAuth.id]
	}),
}));