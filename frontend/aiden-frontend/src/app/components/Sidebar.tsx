"use client";

import { useEffect, useState } from "react";
import { signOut, useSession } from "next-auth/react";

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

export default function Sidebar({
  userId,
  onSelectConversation,
}: {
  userId: number;
  onSelectConversation: (conv: Conversation) => void;
}) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const { data: session } = useSession();

  useEffect(() => {
    async function fetchHistory() {
      try {
        const res = await fetch(
          `http://127.0.0.1:8000/api/history/${userId}/`
        );
        const data = await res.json();
        setConversations(data);
      } catch (err) {
        console.error("Error fetching history:", err);
      }
    }
    if (userId) fetchHistory();
  }, [userId]);

  return (
    <aside className="w-64 bg-gray-900 text-white border-r border-gray-700 flex flex-col">
      {/* Header */}
      <h2 className="p-4 text-lg font-bold border-b border-gray-700">
        Conversations
      </h2>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto">
        {conversations.length > 0 ? (
          conversations.map((conv) => (
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

      {/* User Section at Bottom */}
      {session && (
        <div className="relative border-t border-gray-700">
          <button
            onClick={() => setMenuOpen((prev) => !prev)}
            className="w-full text-left px-4 py-3 hover:bg-gray-800 flex justify-between items-center"
          >
            <span>{session.user?.name || session.user?.email}</span>
            <span className="text-gray-400">▼</span>
          </button>

          {menuOpen && (
            <div className="absolute bottom-12 left-0 w-full bg-gray-800 border border-gray-700 rounded shadow-lg">
              <button className="block w-full text-left px-4 py-2 hover:bg-gray-700">
                Settings
              </button>
              <button className="block w-full text-left px-4 py-2 hover:bg-gray-700">
                Help Center
              </button>
              <button
                onClick={() => signOut()}
                className="block w-full text-left px-4 py-2 text-red-400 hover:bg-gray-700"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      )}
    </aside>
  );
}
