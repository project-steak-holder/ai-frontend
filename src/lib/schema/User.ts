import { userInNeonAuth } from "@drizzle/auth/schema";

export const User = userInNeonAuth;

/** Types */
export type User = typeof User.$inferSelect;
export type NewUser = typeof User.$inferInsert;
export type UpdateUser = Partial<NewUser>;
