import { create } from "zustand";

interface OpenDialogOptions {
	id?: string;
	name?: string;
	title?: string;
	description?: string;
	type?: "conversation" | "confirmation";
	onConfirm?: () => void;
}
interface DialogState {
	isOpen: boolean;
	conversationId?: string;
	name?: string;
	title?: string;
	description?: string;
	type?: "conversation" | "confirmation";
	onConfirm?: () => void;
	openDialog: (options: OpenDialogOptions) => void;
	closeDialog: () => void;
}

export const useDialogStore = create<DialogState>((set) => ({
	isOpen: false,
	conversationId: undefined,
	name: undefined,
	onConfirm: undefined,
	type: undefined,
	openDialog: (options: OpenDialogOptions) =>
		set({
			isOpen: true,
			conversationId: options.id,
			name: options.name,
			title: options.title,
			description: options.description,
			type: options.type,
			onConfirm: options.onConfirm,
		}),
	closeDialog: () =>
		set({
			isOpen: false,
			conversationId: undefined,
			name: undefined,
			title: undefined,
			description: undefined,
			onConfirm: undefined,
			type: undefined,
		}),
}));
