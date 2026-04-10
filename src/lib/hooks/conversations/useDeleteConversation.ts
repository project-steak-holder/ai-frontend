import { deleteConversation } from "@server/api/conversations";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
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
	const navigate = useNavigate();

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
		onSuccess: async (deletedConversation) => {
			await queryClient.invalidateQueries({
				queryKey: ["conversations", userId],
			});
			if (deletedConversation?.id) {
				await queryClient.invalidateQueries({
					queryKey: ["conversation", deletedConversation.id, userId],
				});
				toast.success("Conversation deleted");
				navigate({ to: "/" });
			}
		},
		onError: () => {
			toast.error("Error deleting conversation");
		},
	});
}
