// src/components/error-handling/types.ts
export interface ErrorBoundaryState {
	hasError: boolean;
	error: Error | null;
	errorInfo: React.ErrorInfo | null;
	timestamp: Date | null;
	errorCount: number;
}

export interface CapturedError {
	message: string;
	stack?: string;
	componentStack?: string;
	boundaryName: string;
	route?: string;
	timestamp: Date;
	userAgent: string;
	environment: "development" | "production";
}

export interface ErrorDisplayProps {
	error: Error;
	errorInfo?: React.ErrorInfo | null;
	boundaryName: string;
	route?: string;
	timestamp: Date;
	onDismiss: () => void;
	onCopy?: () => void;
	onReload?: () => void;
	isPersistent?: boolean;
}
