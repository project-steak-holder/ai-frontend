import { UserButton } from "@neondatabase/neon-js/auth/react";
import { useParams } from "@tanstack/react-router";
import { Menu } from "lucide-react";
import { useConversation } from "@/lib/hooks/conversations/useConversation";
import { Button } from "../ui/button";

interface HeaderProps {
	onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
	const { conversationId } = useParams({ strict: false });
	const { conversation, error } = useConversation(conversationId as string);
	return (
		<>
			{/* Mobile top bar */}
			<header className="flex h-14 p-3 border-b bg-card gap-2">
				<Button
					className="md:hidden"
					variant="ghost"
					size="icon"
					onClick={onMenuClick}
					aria-label="Open navigation menu"
				>
					<Menu className="h-5 w-5" />
				</Button>
				<div className="flex gap-2 items-center">
					{error && "Error loading conversation title"}
					{conversation?.name}
				</div>
				<div className="ml-auto mr-3">
					<UserButton size={"icon"} />
				</div>
			</header>
		</>
	);
}
