import { CreateConversationDialog } from "@components/dialogs/ConversationDialog";
import { SignedIn, SignedOut } from "@neondatabase/neon-js/auth/react";
import { Link, useParams } from "@tanstack/react-router";
import { AlertCircle, MessageSquare } from "lucide-react";
import { useConversations } from "@/lib/hooks/conversations/useConversations";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription } from "../ui/alert";
import { Separator } from "../ui/separator";

export const SideBar = () => {
	const { conversations, isLoading, error } = useConversations();
	const { conversationId } = useParams({ strict: false });

	return (
		<div className="h-full w-64 flex flex-col border-r bg-sidebar overflow-hidden">
			<div className="px-4 h-16 border-b flex items-center justify-center shrink-0">
				<Link to="/" className="hover:text-primary transition-colors">
					<h2 className="text-xl font-semibold text-foreground">
						Stakeholder AI Chat
					</h2>
				</Link>
			</div>

			<div className="px-3 py-3 space-y-0.5">
				{error && (
					<Alert variant="destructive">
						<AlertCircle className="h-4 w-4" />
						<AlertDescription>{error.message}</AlertDescription>
					</Alert>
				)}

				{!isLoading && !error && conversations?.length === 0 && (
					<p className="text-sm text-muted-foreground px-2 py-2">
						No conversations yet.
					</p>
				)}
				<div className="flex flex-col space-y-1">
					{!isLoading &&
						!error &&
						conversations?.map((conv) => (
							<Link
								key={conv.id}
								to="/chat/$conversationId"
								params={{ conversationId: conv.id }}
								className={cn(
									"flex items-center gap-2.5 px-3 py-2 rounded-md text-sm w-full transition-colors overflow-hidden",
									"text-muted-foreground hover:text-foreground hover:bg-accent",
									conversationId === conv.id &&
										"bg-accent text-foreground font-medium",
								)}
							>
								<MessageSquare className="h-4 w-4 shrink-0 opacity-60" />
								<span className="truncate min-w-0">{conv.name}</span>
							</Link>
						))}
				</div>
			</div>

			<div className="mt-auto mx-6 mb-6">
				<Separator className="my-6" />
				<SignedIn>
					<CreateConversationDialog />
				</SignedIn>
				<SignedOut>
					<p className="text-sm text-muted-foreground">
						Sign in to create conversations.
					</p>
				</SignedOut>
			</div>
		</div>
	);
};
