import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { authClient } from "@/integrations/neon-auth/client";
import type { Message } from "@/lib/schema/Message";
import { sendMessage } from "@/server/api/messages";
export const useSendMessage = () => {
	const { data: session } = authClient.useSession();
	const userId = session?.user?.id;

	const queryClient = useQueryClient();
	return useMutation({
		mutationKey: ["sendMessage", userId],
		mutationFn: async ({
			conversationId,
			content,
		}: {
			conversationId: string;
			content: string;
		}) => {
			let token: string | null = null;

			const { data } = await authClient.getSession({
				fetchOptions: {
					onSuccess: (ctx) => {
						token = ctx.response.headers.get("set-auth-jwt");
					},
				},
			});

			if (!token && typeof data?.session?.token === "string") {
				token = data.session.token;
			}

			if (!token) {
				throw new Error("You must be signed in to send a message");
			}

			return await sendMessage({
				data: {
					conversationId,
					content,
					token,
				},
			});
		},
		onMutate: async (variables) => {
			const queryKey = ["messages", userId, variables.conversationId] as const;

			await queryClient.cancelQueries({ queryKey });

			const previousMessages = queryClient.getQueryData<Message[]>(queryKey);

			const now = new Date().toISOString();
			const optimisticMessage: Message = {
				id: `optimistic-${Date.now()}`,
				conversationId: variables.conversationId,
				userId: userId as string,
				content: variables.content,
				type: "USER",
				createdAt: now,
				updatedAt: now,
			};

			queryClient.setQueryData<Message[]>(queryKey, (current) => {
				if (!current) {
					return [optimisticMessage];
				}

				return [...current, optimisticMessage];
			});

			return { previousMessages, queryKey };
		},
		onError: (_error, _variables, context) => {
			if (!context) {
				return;
			}
			toast.error(
				"Oops! Something went wrong while sending your message. Please try again.",
			);
			queryClient.setQueryData(context.queryKey, context.previousMessages);
		},
		onSuccess: async (_, variables) => {
			await queryClient.invalidateQueries({
				queryKey: ["messages", userId, variables.conversationId],
			});
		},
	});
};
