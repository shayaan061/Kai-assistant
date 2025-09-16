"use client";

import { useEffect, useState } from "react";

interface Message {
  role: string;
  content: string;
  timestamp: string;
}

interface Conversation {
  conversation_id: number;
  title: string;
  messages: Message[];
}

export default function Sidebar({ userId, onSelectConversation }: { userId: number, onSelectConversation: (conv: Conversation) => void }) {
  const [conversations, setConversations] = useState<Conversation[]>([]);

  useEffect(() => {
    async function fetchHistory() {
      try {
        const res = await fetch(`http://127.0.0.1:8000/api/history/${userId}/`);
        const data = await res.json();
        setConversations(data);
      } catch (err) {
        console.error("Error fetching history:", err);
      }
    }
    fetchHistory();
  }, [userId]);

  return (
    <aside className="w-64 bg-gray-900 text-white border-r border-gray-700 flex flex-col">
      <h2 className="p-4 text-lg font-bold border-b border-gray-700">Conversations</h2>
      <div className="flex-1 overflow-y-auto">
        {conversations.length > 0 ? (
          conversations.map(conv => (
            <button
              key={conv.conversation_id}
              onClick={() => onSelectConversation(conv)}
              className="w-full text-left px-4 py-2 hover:bg-gray-800 border-b border-gray-700"
            >
              {conv.title}
            </button>
          ))
        ) : (
          <p className="p-4 text-gray-400">No conversations yet</p>
        )}
      </div>
    </aside>
  );
}
