import { useEffect } from "react";
import type { CapturedError } from "@/components/error-handling/types";

// TODO: Enhance this hook to send errors to a remote logging service in production
export const useErrorLogger = (error: CapturedError) => {
	useEffect(() => {
		console.error("[Error Boundary]", error);

		if (error.environment === "development") {
			try {
				if (typeof globalThis.sessionStorage !== "undefined") {
					sessionStorage.setItem("lastError", JSON.stringify(error));
				}
			} catch (storageError) {
				console.warn(
					"[Error Boundary] Failed to persist error in sessionStorage",
					storageError,
				);
			}
		}
	}, [error]);
};
