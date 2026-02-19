import { createConversation } from "@server/api/conversations";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { authClient } from "@/integrations/neon-auth/client";

interface CreateConversationInput {
	name: string;
}

export function useCreateConversation() {
	const { data: session } = authClient.useSession();
	const userId = session?.user?.id;

	const queryClient = useQueryClient();

	return useMutation({
		mutationKey: ["conversations", userId],
		mutationFn: async ({ name }: CreateConversationInput) => {
			return await createConversation({
				data: {
					userId: userId as string,
					name,
				},
			});
		},
		onSuccess: async () => {
			await queryClient.invalidateQueries({
				queryKey: ["conversations", userId],
			});
		},
	});
}
