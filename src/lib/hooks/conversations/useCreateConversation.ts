import { createConversation } from "@server/api/conversations";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "node_modules/@tanstack/react-router/dist/esm/useNavigate";
import { toast } from "sonner";
import { authClient } from "@/integrations/neon-auth/client";
import { guard } from "@/lib/utils";

interface CreateConversationInput {
	name: string;
}

export function useCreateConversation() {
	const { data: session } = authClient.useSession();
	const userId = session?.user?.id;
	const navigate = useNavigate();

	const queryClient = useQueryClient();

	return useMutation({
		mutationKey: ["conversations", userId],
		mutationFn: async ({ name }: CreateConversationInput) => {
			const safeUserId = guard(
				userId,
				"You must be signed in to create a conversation",
			);
			return await createConversation({
				data: {
					userId: safeUserId,
					name,
				},
			});
		},
		onSuccess: async (data) => {
			await queryClient.invalidateQueries({
				queryKey: ["conversations", userId],
			});
			toast.success("Conversation created successfully");
			navigate({ to: `/chat/${data.id}` });
		},
		onError: (error) => {
			toast.error(
				error instanceof Error
					? error.message
					: "An error occurred while creating the conversation",
			);
		},
	});
}
