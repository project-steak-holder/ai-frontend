// src/components/error-handling/RouteErrorBoundary.tsx
import { useRouter } from "@tanstack/react-router";
import { useErrorLogger } from "@/lib/hooks/useErrorLogger";
import { ErrorFallback } from "./ErrorFallback";
import { ErrorOverlay } from "./ErrorOverlay";
import type { CapturedError } from "./types";

interface RouteErrorBoundaryProps {
	error: Error;
}

export const RouteErrorBoundary = ({ error }: RouteErrorBoundaryProps) => {
	const router = useRouter();
	const timestamp = new Date();
	const isDev = import.meta.env.DEV;

	const capturedError: CapturedError = {
		message: error.message,
		stack: error.stack,
		boundaryName: "RouteErrorBoundary",
		route: window.location.pathname,
		timestamp,
		userAgent: navigator.userAgent,
		environment: isDev ? "development" : "production",
	};

	useErrorLogger(capturedError);

	const handleDismiss = () => {
		router.invalidate();
	};

	const handleReload = () => {
		window.location.reload();
	};

	const handleCopy = () => {
		const errorText = `
Error: ${error.message}

Stack Trace:
${error.stack || "No stack trace available"}
    `.trim();

		navigator.clipboard.writeText(errorText);
	};

	if (isDev) {
		return (
			<ErrorOverlay
				error={error}
				boundaryName="RouteErrorBoundary"
				route={window.location.pathname}
				timestamp={timestamp}
				onDismiss={handleDismiss}
				onCopy={handleCopy}
				onReload={handleReload}
			/>
		);
	}

	return (
		<ErrorFallback
			error={error}
			boundaryName="RouteErrorBoundary"
			timestamp={timestamp}
			onDismiss={handleDismiss}
			onReload={handleReload}
		/>
	);
};
