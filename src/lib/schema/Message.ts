import { message } from "@drizzle/public/schema";

export const Message = message;

/** Types */
export type Message = typeof Message.$inferSelect;
export type NewMessage = typeof Message.$inferInsert;
export type UpdateMessage = Partial<NewMessage>;
