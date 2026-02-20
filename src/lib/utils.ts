import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { z } from "zod";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

/**
 * guard is a utility function that checks if a value is null or undefined,
 * and throws an error if it is. It can also validate the value against a Zod schema if provided.
 * @param value The value to check or validate.
 * @param errorMessage The error message to throw if the value is invalid.
 */
export function guard<T>(
	value: T | null | undefined,
	errorMessage?: string,
): NonNullable<T>;
export function guard<TSchema extends z.ZodTypeAny>(
	value: unknown,
	schema: TSchema,
	errorMessage?: string,
): z.infer<TSchema>;
export function guard<TSchema extends z.ZodTypeAny>(
	value: unknown,
	schemaOrMessage?: TSchema | string,
	errorMessage = "Value is required",
) {
	const message =
		typeof schemaOrMessage === "string" ? schemaOrMessage : errorMessage;

	if (value === null || value === undefined) {
		throw new Error(message);
	}

	if (schemaOrMessage && typeof schemaOrMessage !== "string") {
		const parsed = schemaOrMessage.safeParse(value);

		if (!parsed.success) {
			throw new Error(message);
		}

		return parsed.data;
	}

	return value as NonNullable<typeof value>;
}
