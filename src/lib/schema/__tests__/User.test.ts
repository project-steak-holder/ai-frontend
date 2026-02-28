import { assertType, describe, expectTypeOf, it } from "vitest";
import type { NewUser, UpdateUser, User } from "../User";

describe("User Types", () => {
	it("should have correct User type structure", () => {
		expectTypeOf<User>().toHaveProperty("id");
		expectTypeOf<User>().toHaveProperty("name");
		expectTypeOf<User>().toHaveProperty("email");
		expectTypeOf<User>().toHaveProperty("emailVerified");
		expectTypeOf<User>().toHaveProperty("image");
		expectTypeOf<User>().toHaveProperty("createdAt");
		expectTypeOf<User>().toHaveProperty("updatedAt");
		expectTypeOf<User>().toHaveProperty("role");
		expectTypeOf<User>().toHaveProperty("banned");
		expectTypeOf<User>().toHaveProperty("banReason");
		expectTypeOf<User>().toHaveProperty("banExpires");
	});

	it("should have correct non-nullable field types", () => {
		expectTypeOf<User["id"]>().toBeString();
		expectTypeOf<User["name"]>().toBeString();
		expectTypeOf<User["email"]>().toBeString();
		expectTypeOf<User["emailVerified"]>().toBeBoolean();
		expectTypeOf<User["createdAt"]>().not.toBeNullable();
		expectTypeOf<User["updatedAt"]>().not.toBeNullable();
	});

	it("should have nullable optional fields", () => {
		expectTypeOf<User["image"]>().toBeNullable();
		expectTypeOf<User["role"]>().toBeNullable();
		expectTypeOf<User["banned"]>().toBeNullable();
		expectTypeOf<User["banReason"]>().toBeNullable();
		expectTypeOf<User["banExpires"]>().toBeNullable();
	});

	it("UpdateUser should have all fields optional", () => {
		const update: UpdateUser = {};
		assertType<UpdateUser>(update);

		const withEmail: UpdateUser = { email: "new@example.com" };
		assertType<UpdateUser>(withEmail);

		const withName: UpdateUser = { name: "New Name" };
		assertType<UpdateUser>(withName);

		const withMultiple: UpdateUser = {
			name: "New Name",
			email: "new@example.com",
		};
		assertType<UpdateUser>(withMultiple);
	});

	it("NewUser should be assignable with required fields", () => {
		const user: NewUser = {
			name: "Test User",
			email: "test@example.com",
			emailVerified: false,
		};
		assertType<NewUser>(user);
	});
});
