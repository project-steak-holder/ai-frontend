import type { userInNeonAuth } from "@drizzle/auth/schema";

/** Types */
export type User = typeof userInNeonAuth.$inferSelect;
export type NewUser = typeof userInNeonAuth.$inferInsert;
export type UpdateUser = Partial<NewUser>;
