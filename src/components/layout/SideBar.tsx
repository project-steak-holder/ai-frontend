import { CreateConversationDialog } from "@components/dialogs/ConversationDialog";
import { useState } from "react";

export const SideBar = () => {
	const [conversations, setConversations] = useState([
		{ id: 1, title: "Requirements Elicitation" },
		{ id: 2, title: "Convo 2" },
	]);

	const handleCreateConversation = (title: string) => {
		setConversations((prev) => [...prev, { id: prev.length + 1, title }]);
		console.log("New conversation:", title);
	};

	return (
		<div className="h-full w-64 flex flex-col border-r">
			<div className="flex-1 p-4 space-y-2 overflow-y-auto">
				{conversations.map((conv) => (
					<div
						key={conv.id}
						className="px-3 py-2 text-sm rounded-lgcursor-pointer"
					>
						{conv.title}
					</div>
				))}
			</div>

			<CreateConversationDialog onCreate={handleCreateConversation} />
		</div>
	);
};
