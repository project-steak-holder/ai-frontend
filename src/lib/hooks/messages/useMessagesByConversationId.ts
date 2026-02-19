/**
 * Custom hook to fetch messages for a specific conversation.
 */
import { useQuery } from "@tanstack/react-query";
import { authClient } from "@/integrations/neon-auth/client";
import { getMessagesByConversationId } from "@/server/api/messages";

export const useMessagesByConversationId = (conversationId: string) => {
	const { data: session } = authClient.useSession();
	const userId = session?.user?.id;

	return useQuery({
		queryKey: ["messages", userId, conversationId],
		queryFn: () =>
			getMessagesByConversationId({
				data: { conversationId, userId: userId as string },
			}),
		enabled: !!conversationId && !!userId,
	});
};
