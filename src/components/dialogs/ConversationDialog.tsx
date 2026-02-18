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

export function CreateConversationDialog({
	onCreate,
}: {
	onCreate?: (title: string) => void;
}) {
	const [open, setOpen] = useState(false);
	const [title, setTitle] = useState("");

	const handleCreate = () => {
		const trimmed = title.trim();
		if (!trimmed) return;
		onCreate?.(trimmed);
		setTitle("");
		setOpen(false);
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button className="m-4">New Conversation</Button>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>New Conversation</DialogTitle>
					<DialogDescription>Name your conversation</DialogDescription>
				</DialogHeader>
				<Input
					value={title}
					onChange={(e) => setTitle(e.target.value)}
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
					<Button onClick={handleCreate}>Create</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
