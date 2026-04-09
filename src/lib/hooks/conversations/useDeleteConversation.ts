import { deleteConversation } from "@server/api/conversations";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { authClient } from "@/integrations/neon-auth/client";
import { guard } from "@/lib/utils";

interface DeleteConversationInput {
	id: string;
}

export function useDeleteConversation() {
	const { data: session } = authClient.useSession();
	const userId = session?.user?.id;

	const queryClient = useQueryClient();

	return useMutation({
		mutationKey: ["conversations", userId],
		mutationFn: async ({ id }: DeleteConversationInput) => {
			const safeUserId = guard(
				userId,
				"You must be signed in to delete a conversation",
			);
			return await deleteConversation({
				data: {
					id,
					userId: safeUserId,
				},
			});
		},
		onSuccess: async ({ id }) => {
			await queryClient.invalidateQueries({
				queryKey: ["conversations", userId],
			});
			await queryClient.invalidateQueries({
				queryKey: ["conversation", id, userId],
			});
			toast.success("Conversation deleted");
		},
		onError: () => {
			toast.error("Error deleting conversation");
		},
	});
}
