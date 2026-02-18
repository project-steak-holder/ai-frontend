import { useState } from "react";
import { CreateConversationDialog } from "@/components/CreateConversationDialog";

export const SideBar = () => {
  const [conversations, setConversations] = useState([
    { id: 1, title: "Requirements Elicitation" },
    { id: 2, title: "Convo 2" },
  ]);

  const handleCreateConversation = (title: string) => {
    setConversations((prev) => [
      ...prev,
      { id: prev.length + 1, title },
    ]);
    console.log("New conversation:", title);
  };

  return (
    <div className="h-full w-64 flex flex-col border-r border-gray-200 bg-white">
      <div className="flex-1 p-4 space-y-2 overflow-y-auto">
        {conversations.map((conv) => (
          <div
            key={conv.id}
            className="px-3 py-2 text-sm rounded-lg hover:bg-gray-100 cursor-pointer"
          >
            {conv.title}
          </div>
        ))}
      </div>

      <CreateConversationDialog onCreate={handleCreateConversation} />
    </div>
  );
};
