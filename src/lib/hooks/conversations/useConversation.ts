/**
 * Custom hook to fetch a conversation by its ID for the authenticated user.
 */
import { useQuery } from "@tanstack/react-query";
import { authClient } from "@/integrations/neon-auth/client";
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
		queryFn: () =>
			getConversationById({
				data: { conversationId, userId: userId as string },
			}),
		enabled: !!userId && !!conversationId,
	});

	return { conversation, isLoading, error };
};
