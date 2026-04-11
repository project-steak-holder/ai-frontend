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
	const {
		isOpen,
		closeDialog,
		title,
		description,
		type,
		warningText,
		onConfirm,
	} = useDialogStore();
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
					<DialogDescription>
						{description}
						{warningText && <> {warningText}</>}
					</DialogDescription>
				</DialogHeader>
				<DialogFooter>
					<Button variant="outline" onClick={handleCancel}>
						No
					</Button>
					<Button variant="destructive" onClick={handleConfirm}>
						Yes
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
