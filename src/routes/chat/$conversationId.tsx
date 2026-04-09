import { authClient } from "@integrations/neon-auth/client";
import { SignedIn, SignedOut } from "@neondatabase/neon-js/auth/react/ui";
import { createFileRoute, redirect } from "@tanstack/react-router";
import type { SubmitEventHandler } from "react";
import { z } from "zod";
import { ChatLayout } from "@/components/layout/ChatLayout";
import { Input } from "@/components/ui/input";
import { useStreamingResponse } from "@/lib/hooks/messages";

const ConversationIdSchema = z.uuid();

export const Route = createFileRoute("/chat/$conversationId")({
	beforeLoad: ({ params }) => {
		if (!ConversationIdSchema.safeParse(params.conversationId).success) {
			throw redirect({ to: "/" });
		}
	},
	component: ChatPage,
});

function ChatPage() {
	const { conversationId } = Route.useParams();
	const { data: session } = authClient.useSession();
	const { streamMessage, streamedText, isStreaming } =
		useStreamingResponse(conversationId);

	const handleSubmit: SubmitEventHandler<HTMLFormElement> = (e) => {
		e.preventDefault();
		const input = e.currentTarget.elements.namedItem(
			"message",
		) as HTMLInputElement;
		if (!input.value.trim()) return;
		streamMessage(input.value);
		input.value = "";
	};

	return (
		<div className="flex flex-col h-full">
			<SignedIn>
				<div className="flex-1 min-h-0 p-4">
					<ChatLayout
						conversationId={conversationId}
						streamedText={isStreaming ? streamedText : undefined}
						user={session?.user}
					/>
				</div>

				<div className="p-4 border-t">
					<form onSubmit={handleSubmit}>
						<Input
							name="message"
							type="text"
							placeholder="Type a message..."
							autoComplete="off"
							disabled={isStreaming}
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
