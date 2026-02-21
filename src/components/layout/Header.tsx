import { UserButton } from "@neondatabase/auth/react";
import { useParams } from "@tanstack/react-router";
import { useConversation } from "@/lib/hooks/conversations/useConversation";

export default function Header() {
	const { conversationId } = useParams({ strict: false });
	const { conversation, error } = useConversation(conversationId as string);

	return (
		<header className="h-16 p-4 flex bg-card border-b">
			<div className="flex gap-2 items-center">
				{error && "Error loading conversation title"}
				{conversation?.name}
			</div>
			<div className="ml-auto">
				<UserButton size={"icon"} />
			</div>
		</header>
	);
}
