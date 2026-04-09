import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { useDialogStore } from "@/stores/dialogStore";
import { Button } from "../ui/button";

export function ConfirmationDialog() {
	const { isOpen, closeDialog, title, description, type, name, onConfirm } =
		useDialogStore();
	const handleConfirm = async () => {
		await onConfirm?.();
		closeDialog();
	};
	const handleCancel = () => {
		closeDialog();
	};
	const isConfirmationDialog = type === "confirmation";
	return (
		<Dialog
			open={isOpen && isConfirmationDialog}
			onOpenChange={(open) => !open && closeDialog()}
		>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
					<DialogDescription>{description}</DialogDescription>
					You are about to delete the conversation "{name}". This action cannot
					be undone.
				</DialogHeader>
				<DialogFooter>
					<Button onClick={handleConfirm}>Yes</Button>
					<Button variant="outline" onClick={handleCancel}>
						No
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
