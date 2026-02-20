import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useCreateConversation } from "@/lib/hooks/conversations/useCreateConversation";

export function CreateConversationDialog() {
	const [open, setOpen] = useState(false);
	const [title, setTitle] = useState("");
	const { mutateAsync: createConversation } = useCreateConversation();

	const handleCreate = async () => {
		const trimmed = title.trim();
		if (!trimmed) return;
		await createConversation({ name: trimmed });
		setTitle("");
		setOpen(false);
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button className="w-full">New Conversation</Button>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>New Conversation</DialogTitle>
					<DialogDescription>Name your conversation</DialogDescription>
				</DialogHeader>
				<Input
					value={title}
					onChange={(e) => setTitle(e.target.value)}
					onKeyDown={(e) => {
						if (e.key === "Enter") {
							handleCreate();
						}
					}}
					placeholder="Requirements Elicitation"
				/>
				<DialogFooter>
					<Button
						variant="outline"
						onClick={() => {
							setOpen(false);
							setTitle("");
						}}
					>
						Cancel
					</Button>
					<Button disabled={!title.trim()} onClick={handleCreate}>
						Create
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
