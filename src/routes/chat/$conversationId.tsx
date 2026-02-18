import { queryOptions, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { authClient } from "@/integrations/neon-auth/client";
import { getMessagesByConversationId } from "@/server/api/messages";

const messagesQuery = (conversationId: string, userId: string) =>
	queryOptions({
		queryKey: ["messages", conversationId],
		queryFn: () =>
			getMessagesByConversationId({ data: { conversationId, userId } }),
	});

export const Route = createFileRoute("/chat/$conversationId")({
	loader: async ({ params }) => {
		const { conversationId } = params;

		if (!conversationId) {
			throw new Error("Conversation ID is required");
		}

		return { conversationId };
	},
	component: ChatPage,
});

function ChatPage() {
	const { conversationId } = Route.useParams();
	const queryClient = useQueryClient();

	const { data: session } = authClient.useSession();

	const {
		data: messages,
		isLoading,
		error,
	} = useQuery({
		...messagesQuery(conversationId, session?.user?.id ?? ""),
		enabled: !!session?.user?.id,
	});

	// Example: How to invalidate query cache when creating a message
	const handleSendMessage = async (_text: string) => {
		// TODO: Call createMessage server function here
		// await createMessage({ text, conversationId, userId: session.user.id });

		// Invalidate to refetch
		await queryClient.invalidateQueries({
			queryKey: ["messages", conversationId],
		});
	};

	if (!session?.user) {
		return <div>Please sign in to view messages</div>;
	}

	if (isLoading) {
		return <div>Loading messages...</div>;
	}

	if (error) {
		return <div>Error loading messages: {error.message}</div>;
	}

	return (
		<div className="flex flex-col h-full">
			<div className="flex-1 overflow-auto p-4">
				<div className="whitespace-pre-wrap">
					{JSON.stringify(messages, null, 2)}
				</div>
			</div>

			{/* Example message input */}
			<div className="p-4 border-t">
				<form
					onSubmit={(e) => {
						e.preventDefault();
						const input = e.currentTarget.elements.namedItem(
							"message",
						) as HTMLInputElement;
						handleSendMessage(input.value);
						input.value = "";
					}}
				>
					<input
						name="message"
						type="text"
						placeholder="Type a message..."
						className="w-full px-4 py-2 rounded border"
					/>
				</form>
			</div>
		</div>
	);
}
