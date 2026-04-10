import { create } from "zustand";

interface OpenDialogOptions {
	id?: string;
	name?: string;
	title?: string;
	description?: string;
	warningText?: string;
	type?: "conversation" | "confirmation";
	onConfirm?: () => void | Promise<void>;
}
interface DialogState {
	isOpen: boolean;
	conversationId?: string;
	name?: string;
	title?: string;
	description?: string;
	warningText?: string;
	type?: "conversation" | "confirmation";
	onConfirm?: () => void | Promise<void>;
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
			warningText: options.warningText,
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
			warningText: undefined,
			onConfirm: undefined,
			type: undefined,
		}),
}));
