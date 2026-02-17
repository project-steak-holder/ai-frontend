import { useEffect } from "react";
import type { CapturedError } from "@/components/error-handling/types";

// TODO: Enhance this hook to send errors to a remote logging service in production
export const useErrorLogger = (error: CapturedError) => {
	useEffect(() => {
		console.error("[Error Boundary]", error);

		if (error.environment === "development") {
			sessionStorage.setItem("lastError", JSON.stringify(error));
		}
	}, [error]);
};
