import { updateConversation } from "@server/api/conversations";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { authClient } from "@/integrations/neon-auth/client";
import { guard } from "@/lib/utils";

interface UpdateConversationInput {
	id: string;
	name: string;
}

export function useUpdateConversation() {
	const { data: session } = authClient.useSession();
	const userId = session?.user?.id;

	const queryClient = useQueryClient();

	return useMutation({
		mutationKey: ["conversations", userId],
		mutationFn: async ({ id, name }: UpdateConversationInput) => {
			const safeUserId = guard(
				userId,
				"You must be signed in to update a conversation",
			);

			return await updateConversation({
				data: {
					id,
					userId: safeUserId,
					name,
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
		},
	});
}
