// src/components/error-handling/ErrorFallback.tsx
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import type { ErrorDisplayProps } from "./types";

export const ErrorFallback = ({
	error: _error,
	boundaryName,
	timestamp: _timestamp,
	onDismiss,
	onReload,
}: Omit<ErrorDisplayProps, "onCopy">) => {
	const isRouteError = boundaryName === "RouteErrorBoundary";

	const handleGoHome = () => {
		window.location.assign("/");
		onDismiss();
	};

	const handleReload = () => {
		onReload?.();
	};

	return (
		<div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
			<Card className="max-w-md mx-4">
				<CardHeader>
					<CardTitle>Oops! Something went wrong</CardTitle>
					<CardDescription>
						{isRouteError
							? "We couldn't load this page. Don't worry, the rest of the app should still work."
							: "The application encountered an unexpected error."}
					</CardDescription>
				</CardHeader>

				<CardContent>
					<Alert>
						<AlertCircle className="h-4 w-4" />
						<AlertDescription>
							Try refreshing the page or returning to the home page.
						</AlertDescription>
					</Alert>
				</CardContent>

				<CardFooter className="flex gap-2">
					<Button onClick={handleGoHome} variant="default">
						Go to Home
					</Button>
					<Button onClick={handleReload} variant="outline">
						Refresh Page
					</Button>
				</CardFooter>
			</Card>
		</div>
	);
};
