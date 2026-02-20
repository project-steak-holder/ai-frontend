/**
 * Custom hook to fetch messages for a specific conversation.
 */
import { useQuery } from "@tanstack/react-query";
import { authClient } from "@/integrations/neon-auth/client";
import { guard } from "@/lib/utils";
import { getMessagesByConversationId } from "@/server/api/messages";

export const useMessagesByConversationId = (conversationId: string) => {
	const { data: session } = authClient.useSession();
	const userId = session?.user?.id;

	return useQuery({
		queryKey: ["messages", userId, conversationId],
		queryFn: () => {
			const safeUserId = guard(
				userId,
				"You must be signed in to view messages",
			);

			return getMessagesByConversationId({
				data: { conversationId, userId: safeUserId },
			});
		},
		enabled: !!conversationId && !!userId,
	});
};
