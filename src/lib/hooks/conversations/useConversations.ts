/**
 * Custom hook to fetch conversations for the authenticated user.
 */
import { useQuery } from "@tanstack/react-query";
import { authClient } from "@/integrations/neon-auth/client";
import { guard } from "@/lib/utils";
import { getConversations } from "@/server/api/conversations";

export const useConversations = () => {
	const { data: session } = authClient.useSession();
	const userId = session?.user?.id;

	const {
		data: conversations,
		isLoading,
		error,
	} = useQuery({
		queryKey: ["conversations", userId],
		queryFn: () => {
			const safeUserId = guard(
				userId,
				"You must be signed in to view conversations",
			);

			return getConversations({ data: { userId: safeUserId } });
		},
		enabled: !!userId,
	});

	return { conversations, isLoading, error };
};
