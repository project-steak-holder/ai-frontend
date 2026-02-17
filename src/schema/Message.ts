import type { message } from "@drizzle/public/schema";

/** Types */
export type Message = typeof message.$inferSelect;
export type NewMessage = typeof message.$inferInsert;
export type UpdateMessage = Partial<NewMessage>;
