import { UserAvatar } from "@neondatabase/neon-js/auth/react";
import { UserRound } from "lucide-react";
import { useEffect, useRef } from "react";
import { useMessagesByConversationId } from "@/lib/hooks/messages";
import type { Message } from "@/lib/schema/Message";
import { cn } from "@/lib/utils";
import ThreeDotsMoveIcon from "../ui/3DotsMoveIcon";
import { ScrollArea } from "../ui/scroll-area";

interface ChatLayoutProps {
	conversationId: string;
	waitingOnResponse?: boolean;
}

export default function ChatLayout({
	conversationId,
	waitingOnResponse,
}: ChatLayoutProps) {
	const scrollAreaContainerRef = useRef<HTMLDivElement | null>(null);
	const {
		data: messages,
		isLoading,
		error,
	} = useMessagesByConversationId(conversationId);
	const messageCount = messages?.length ?? 0;

	useEffect(() => {
		if (!conversationId) return;
		if (messageCount === 0 && !waitingOnResponse) return;

		const viewport = scrollAreaContainerRef.current?.querySelector(
			'[data-slot="scroll-area-viewport"]',
		) as HTMLElement | null;

		if (!viewport) return;

		viewport.scrollTop = viewport.scrollHeight;
	}, [conversationId, messageCount, waitingOnResponse]);

	if (isLoading) {
		return (
			<div className="h-full flex items-center justify-center text-sm text-muted-foreground">
				Loading messages...
			</div>
		);
	}

	if (error) {
		return (
			<div className="h-full flex items-center justify-center text-sm text-destructive">
				Error loading messages: {error.message}
			</div>
		);
	}

	if (!messages?.length) {
		return (
			<div className="h-full flex items-center justify-center text-sm text-muted-foreground">
				No messages yet.
			</div>
		);
	}

	return (
		<div ref={scrollAreaContainerRef} className="h-full min-h-0">
			<ScrollArea className="h-full">
				<div className="flex h-full flex-col justify-end gap-3 p-16">
					{messages?.map((message: Message) => {
						const isUserMessage = message.type === "USER";

						return (
							<div
								key={message.id}
								className={cn(
									"flex w-full items-center gap-2",
									isUserMessage ? "justify-end" : "justify-start",
								)}
							>
								{isUserMessage ? (
									<UserAvatar
										size={"lg"}
										className={cn(
											"h-8 w-8 shrink-0 text-muted-foreground",
											isUserMessage ? "order-2" : "order-1",
										)}
									/>
								) : (
									<UserRound
										className={cn(
											"h-4 w-4 shrink-0 text-muted-foreground",
											isUserMessage ? "order-2" : "order-1",
										)}
									/>
								)}
								<div
									className={cn(
										"max-w-[52%] rounded-2xl px-4 py-2 text-sm whitespace-pre-wrap wrap-break-word",
										isUserMessage ? "order-1" : "order-2",
										isUserMessage
											? "bg-primary text-primary-foreground rounded-br-sm"
											: "bg-muted text-foreground rounded-bl-sm",
									)}
								>
									{message.content}
								</div>
							</div>
						);
					})}
					{waitingOnResponse && (
						<div className="flex w-full justify-start">
							<div className="rounded-2xl px-4 py-2 text-sm bg-muted text-foreground rounded-bl-sm">
								<ThreeDotsMoveIcon />
							</div>
						</div>
					)}
				</div>
			</ScrollArea>
		</div>
	);
}
