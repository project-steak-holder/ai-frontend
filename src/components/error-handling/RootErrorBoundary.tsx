import { Component, type ReactNode } from "react";
import { useErrorLogger } from "@/lib/hooks/useErrorLogger";
import { ErrorFallback } from "./ErrorFallback";
import { ErrorOverlay } from "./ErrorOverlay";
import type { CapturedError, ErrorBoundaryState } from "./types";

interface RootErrorBoundaryProps {
	children: ReactNode;
}

interface ErrorDisplayProps {
	error: Error;
	errorInfo: React.ErrorInfo | null;
	isDev: boolean;
	errorCount: number;
	onDismiss: () => void;
	onCopy: () => void;
	onReload: () => void;
}

const ErrorDisplay = ({
	error,
	errorInfo,
	isDev,
	errorCount,
	onDismiss,
	onCopy,
	onReload,
}: ErrorDisplayProps) => {
	const timestamp = new Date();
	const isPersistentError = errorCount > 3;

	const capturedError: CapturedError = {
		message: error.message,
		stack: error.stack,
		componentStack: errorInfo?.componentStack || undefined,
		boundaryName: "RootErrorBoundary",
		route: window.location.pathname,
		timestamp,
		userAgent: navigator.userAgent,
		environment: isDev ? "development" : "production",
	};

	useErrorLogger(capturedError);

	if (isDev) {
		return (
			<ErrorOverlay
				error={error}
				errorInfo={errorInfo}
				boundaryName="RootErrorBoundary"
				route={window.location.pathname}
				timestamp={timestamp}
				onDismiss={onDismiss}
				onCopy={onCopy}
				onReload={onReload}
				isPersistent={isPersistentError}
			/>
		);
	}

	return (
		<ErrorFallback
			error={error}
			boundaryName="RootErrorBoundary"
			timestamp={timestamp}
			onDismiss={onDismiss}
			onReload={onReload}
		/>
	);
};

export class RootErrorBoundary extends Component<
	RootErrorBoundaryProps,
	ErrorBoundaryState
> {
	constructor(props: RootErrorBoundaryProps) {
		super(props);
		this.state = {
			hasError: false,
			error: null,
			errorInfo: null,
			timestamp: null,
			errorCount: 0,
		};
	}

	static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
		return {
			hasError: true,
			error,
			timestamp: new Date(),
		};
	}

	componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
		// Log to console in development
		if (import.meta.env.DEV) {
			console.error("RootErrorBoundary caught error:", error, errorInfo);
		}

		// Update state with error info
		this.setState((prevState) => ({
			errorInfo,
			errorCount: prevState.errorCount + 1,
		}));
	}

	handleDismiss = () => {
		this.setState({
			hasError: false,
			error: null,
			errorInfo: null,
			timestamp: null,
		});
	};

	handleReload = () => {
		window.location.reload();
	};

	handleCopy = () => {
		const { error, errorInfo } = this.state;
		if (!error) return;

		const errorText = `
Error: ${error.message}

Stack Trace:
${error.stack || "No stack trace available"}

Component Stack:
${errorInfo?.componentStack || "No component stack available"}
    `.trim();

		navigator.clipboard.writeText(errorText);
	};

	render() {
		const { hasError, error, errorInfo, errorCount } = this.state;
		const { children } = this.props;

		if (hasError && error) {
			const isDev = import.meta.env.DEV;

			return (
				<div className="flex flex-col h-screen">
					<ErrorDisplay
						error={error}
						errorInfo={errorInfo}
						isDev={isDev}
						errorCount={errorCount}
						onDismiss={this.handleDismiss}
						onCopy={this.handleCopy}
						onReload={this.handleReload}
					/>
				</div>
			);
		}

		return children;
	}
}
