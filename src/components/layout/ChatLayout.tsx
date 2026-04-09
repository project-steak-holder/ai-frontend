import { UserRound } from "lucide-react";
import { useEffect, useRef } from "react";
import { useMessagesByConversationId } from "@/lib/hooks/messages";
import type { Message } from "@/lib/schema/Message";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { ThreeDotsMoveIcon } from "../ui/3DotsMoveIcon";
import { ScrollArea } from "../ui/scroll-area";

interface ChatLayoutProps {
	conversationId: string;
	streamedText?: string;
	user?: { name: string; image?: string | null };
}

function getInitials(name: string): string {
	const parts = name.trim().split(/\s+/);
	if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
	return name.slice(0, 2).toUpperCase();
}

export function ChatLayout({ conversationId, streamedText, user }: ChatLayoutProps) {
	const scrollAreaContainerRef = useRef<HTMLDivElement | null>(null);
	const {
		data: messages,
		isLoading,
		error,
	} = useMessagesByConversationId(conversationId);
	const messageCount = messages?.length ?? 0;

	useEffect(() => {
		if (!conversationId) return;
		if (messageCount === 0 && !streamedText) return;

		const viewport = scrollAreaContainerRef.current?.querySelector(
			'[data-slot="scroll-area-viewport"]',
		) as HTMLElement | null;

		if (!viewport) return;

		viewport.scrollTop = viewport.scrollHeight;
	}, [conversationId, messageCount, streamedText]);

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
									<Avatar size="sm" className="order-2 shrink-0">
										{user?.image && <AvatarImage src={user.image} alt={user.name} />}
										<AvatarFallback>
											{user ? getInitials(user.name) : <UserRound className="h-3 w-3" />}
										</AvatarFallback>
									</Avatar>
								) : (
									<UserRound
										className={cn(
											"h-4 w-4 shrink-0 text-muted-foreground",
											"order-1",
										)}
									/>
								)}
								<div
									data-testid={isUserMessage ? "user-message" : "ai-message"}
									className={cn(
										"max-w-[85%] sm:max-w-[70%] md:max-w-[60%] lg:max-w-[52%] rounded-2xl px-4 py-2 text-sm whitespace-pre-wrap wrap-anywhere overflow-hidden",
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
					{streamedText != null && (
						<div className="flex w-full items-center gap-2 justify-start">
							<UserRound className="h-4 w-4 shrink-0 text-muted-foreground order-1" />
							<div
								data-testid="ai-message-streaming"
								className="max-w-[85%] sm:max-w-[70%] md:max-w-[60%] lg:max-w-[52%] rounded-2xl px-4 py-2 text-sm whitespace-pre-wrap wrap-anywhere overflow-hidden order-2 bg-muted text-foreground rounded-bl-sm"
							>
								{streamedText || <ThreeDotsMoveIcon />}
							</div>
						</div>
					)}
				</div>
			</ScrollArea>
		</div>
	);
}
