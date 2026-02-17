import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import type { ErrorDisplayProps } from "./types";

export const ErrorOverlay = ({
	error,
	errorInfo,
	boundaryName,
	route,
	timestamp,
	onDismiss,
	onCopy,
	onReload,
	isPersistent = false,
}: ErrorDisplayProps) => {
	const formattedTime = timestamp.toLocaleString();

	return (
		<Dialog open modal>
			<DialogContent className="max-h-[90vh] min-w-[40%] w-full flex flex-col">
				<DialogHeader className="shrink-0">
					<DialogTitle className="flex items-center gap-2">
						<Badge variant="destructive">Error</Badge>
						<span>Component Error Occurred</span>
					</DialogTitle>
					{isPersistent && (
						<Alert variant="destructive" className="mt-2">
							<AlertDescription>
								<strong>Persistent Error Detected:</strong> This error has
								occurred multiple times. Consider reloading the page or checking
								the console for more details.
							</AlertDescription>
						</Alert>
					)}
					<div className="flex gap-2 pt-2">
						<Button onClick={onDismiss} size="sm">
							Dismiss
						</Button>
						<Button onClick={onCopy} variant="outline" size="sm">
							Copy
						</Button>
						<Button onClick={onReload} variant="outline" size="sm">
							Reload
						</Button>
					</div>
				</DialogHeader>

				<ScrollArea className="flex-1 mt-4 min-h-0">
					<div className="space-y-4 pr-4">
						<Alert>
							<AlertDescription className="font-semibold">
								{error.message}
							</AlertDescription>
						</Alert>

						<Separator className="bg-destructive-foreground/20" />

						<div className="space-y-2 text-sm">
							<div>
								<span className="font-semibold">Location:</span> {boundaryName}{" "}
								@ {route}
							</div>
							<div>
								<span className="font-semibold">Time:</span> {formattedTime}
							</div>
						</div>

						<Separator className="bg-destructive-foreground/20" />

						{errorInfo?.componentStack && (
							<>
								<div>
									<h3 className="font-semibold mb-2">Component Stack:</h3>
									<div className="font-mono text-xs bg-black/20 p-3 whitespace-pre overflow-auto">
										{errorInfo.componentStack}
									</div>
								</div>

								<Separator className="bg-destructive-foreground/20" />
							</>
						)}

						<div>
							<h3 className="font-semibold mb-2">Stack Trace:</h3>
							<ScrollArea
								className="max-h-75 w-full rounded border"
								type="always"
							>
								<div className="font-mono text-xs bg-black/20 p-3 whitespace-pre">
									{error.stack}
								</div>
								<ScrollBar orientation="horizontal" />
							</ScrollArea>
						</div>
					</div>
				</ScrollArea>
			</DialogContent>
		</Dialog>
	);
};
