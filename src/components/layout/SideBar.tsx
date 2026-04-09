import { ConversationDialog } from "@components/dialogs/ConversationDialog";
import { SignedIn, SignedOut } from "@neondatabase/neon-js/auth/react/ui";
import { Link, useParams } from "@tanstack/react-router";
import { AlertCircle, MessageSquare } from "lucide-react";
import { useConversations } from "@/lib/hooks/conversations/useConversations";
import { useDeleteConversation } from "@/lib/hooks/conversations/useDeleteConversation";
import { cn } from "@/lib/utils";
import { useDialogStore } from "@/stores/dialogStore";
import { ConfirmationDialog } from "../dialogs/ConfirmationDialog";
import { Alert, AlertDescription } from "../ui/alert";
import { Button } from "../ui/button";
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuTrigger,
} from "../ui/context-menu";
import { Separator } from "../ui/separator";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "../ui/sheet";

interface SideBarProps {
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
}

interface SideBarContentProps {
	onNavigate?: () => void;
}

function SideBarContent({ onNavigate }: SideBarContentProps) {
	const { conversations, isLoading, error } = useConversations();
	const { mutateAsync: deleteConversation } = useDeleteConversation();
	const { openDialog } = useDialogStore();
	const { conversationId } = useParams({ strict: false });

	const handleCreateConversation = () => {
		openDialog({ type: "conversation" });
	};

	const handleRenameConversation = (conversationId: string, name: string) => {
		openDialog({ type: "conversation", id: conversationId, name });
	};

	const handleDeleteConversation = async (
		conversationId: string,
		name: string,
	) => {
		openDialog({
			type: "confirmation",
			name,
			title: "Delete Conversation",
			description: "Are you sure you want to delete this conversation?",
			onConfirm: async () => {
				await deleteConversation({ id: conversationId });
			},
		});
	};

	return (
		<div className="h-full w-full flex flex-col bg-sidebar overflow-hidden">
			<div className="px-4 h-16 flex items-center justify-start shrink-0">
				<Link
					to="/"
					onClick={onNavigate}
					className="hover:text-primary transition-colors"
				>
					<h2 className="text-xl font-semibold text-foreground truncate">
						Stakeholder AI Chat
					</h2>
				</Link>
			</div>

			<div className="px-3 py-3 space-y-0.5 flex-1 overflow-auto">
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
							<ContextMenu key={conv.id}>
								<ContextMenuTrigger>
									<Link
										to="/chat/$conversationId"
										params={{ conversationId: conv.id }}
										onClick={onNavigate}
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
								</ContextMenuTrigger>
								<ContextMenuContent>
									<ContextMenuItem
										onClick={() => handleRenameConversation(conv.id, conv.name)}
									>
										Rename
									</ContextMenuItem>
									<ContextMenuItem
										onClick={() => handleDeleteConversation(conv.id, conv.name)}
									>
										Delete
									</ContextMenuItem>
								</ContextMenuContent>
							</ContextMenu>
						))}
				</div>
			</div>

			<div className="mt-auto mx-6 mb-6">
				<Separator className="my-6" />
				<SignedIn>
					<Button
						className="w-full truncate"
						onClick={handleCreateConversation}
					>
						New Conversation
					</Button>
					<ConversationDialog />
					<ConfirmationDialog />
				</SignedIn>
				<SignedOut>
					<p className="text-sm text-muted-foreground">
						Sign in to create conversations.
					</p>
				</SignedOut>
			</div>
		</div>
	);
}

export function SideBar({ open, onOpenChange }: SideBarProps) {
	return (
		<>
			{/* Desktop sidebar — always visible at md+ */}
			<div className="hidden md:block shrink-0 w-64">
				<SideBarContent />
			</div>

			{/* Mobile sidebar — Sheet drawer */}
			<Sheet open={open} onOpenChange={onOpenChange}>
				<SheetContent side="left" className="p-0">
					<SheetTitle className="sr-only">Navigation</SheetTitle>
					<SheetDescription className="sr-only">
						Conversation list and user profile
					</SheetDescription>
					<SideBarContent onNavigate={() => onOpenChange?.(false)} />
				</SheetContent>
			</Sheet>
		</>
	);
}
