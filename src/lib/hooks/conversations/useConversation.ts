/**
 * Custom hook to fetch a conversation by its ID for the authenticated user.
 */
import { useQuery } from "@tanstack/react-query";
import { authClient } from "@/integrations/neon-auth/client";
import { guard } from "@/lib/utils";
import { getConversationById } from "@/server/api/conversations";

export const useConversation = (conversationId: string) => {
	const { data: session } = authClient.useSession();
	const userId = session?.user?.id;

	const {
		data: conversation,
		isLoading,
		error,
	} = useQuery({
		queryKey: ["conversation", conversationId, userId],
		queryFn: () => {
			const safeUserId = guard(
				userId,
				"You must be signed in to view a conversation",
			);

			return getConversationById({
				data: { conversationId, userId: safeUserId },
			});
		},
		enabled: !!userId && !!conversationId,
	});

	return { conversation, isLoading, error };
};
