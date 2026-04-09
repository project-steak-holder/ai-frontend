import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
	useCreateConversation,
	useUpdateConversation,
} from "@/lib/hooks/conversations";
import { useDialogStore } from "@/stores/dialogStore";

export function ConversationDialog() {
	const { isOpen, conversationId, name, closeDialog, type } = useDialogStore();
	const [title, setTitle] = useState("");

	useEffect(() => {
		setTitle(name || "");
	}, [name]);

	const { mutateAsync: createConversation } = useCreateConversation();
	const { mutateAsync: updateConversation } = useUpdateConversation();
	const isConversationDialog = type === "conversation";

	const handleConfirm = async () => {
		const trimmed = title.trim();
		if (!trimmed) return;
		try {
			if (conversationId) {
				await updateConversation({ id: conversationId, name: trimmed });
			} else {
				await createConversation({ name: trimmed });
			}
			setTitle(name || "");
			closeDialog();
		} catch {
			// Error already handled by mutation's onError
		}
	};

	return (
		<Dialog
			open={isOpen && isConversationDialog}
			onOpenChange={(open) => !open && closeDialog()}
		>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>
						{conversationId ? "Rename Conversation" : "New Conversation"}
					</DialogTitle>
					<DialogDescription>
						{conversationId
							? "Enter a new name for your conversation"
							: "Name your conversation"}
					</DialogDescription>
				</DialogHeader>
				<Input
					value={title}
					onChange={(e) => setTitle(e.target.value)}
					onKeyDown={(e) => {
						if (e.key === "Enter") {
							handleConfirm();
						}
					}}
					placeholder="Requirements Elicitation"
					aria-label="Conversation name"
				/>
				<DialogFooter>
					<Button variant="outline" onClick={closeDialog}>
						Cancel
					</Button>
					<Button disabled={!title.trim()} onClick={handleConfirm}>
						{conversationId ? "Rename" : "Create"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
