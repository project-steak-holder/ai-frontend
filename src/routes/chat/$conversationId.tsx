import { SignedIn, SignedOut } from "@neondatabase/neon-js/auth/react/ui";
import { createFileRoute } from "@tanstack/react-router";
import ChatLayout from "@/components/layout/ChatLayout";
import { Input } from "@/components/ui/input";
import { useSendMessage } from "@/lib/hooks/messages/useSendMessage";

export const Route = createFileRoute("/chat/$conversationId")({
	component: ChatPage,
});

function ChatPage() {
	const { conversationId } = Route.useParams();
	const { mutateAsync: sendMessage, isPending } = useSendMessage();
	const handleSendMessage = async (message: string) => {
		await sendMessage({ conversationId, content: message });
	};
	return (
		<div className="flex flex-col h-full">
			<SignedIn>
				<div className="flex-1 overflow-auto p-4">
					<ChatLayout waitingOnResponse={isPending} />
				</div>

				<div className="p-4 border-t">
					<form
						onSubmit={(e) => {
							e.preventDefault();
							const input = e.currentTarget.elements.namedItem(
								"message",
							) as HTMLInputElement;
							handleSendMessage(input.value);
							input.value = "";
						}}
					>
						<Input
							name="message"
							type="text"
							placeholder="Type a message..."
							autoComplete="off"
							disabled={isPending}
						/>
					</form>
				</div>
			</SignedIn>
			<SignedOut>
				<div className="h-full flex items-center justify-center text-sm text-muted-foreground">
					Please sign in to view the conversation.
				</div>
			</SignedOut>
		</div>
	);
}
