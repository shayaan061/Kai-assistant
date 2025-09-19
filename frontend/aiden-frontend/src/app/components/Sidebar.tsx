"use client";

import { useEffect, useState } from "react";
import { signIn, signOut, useSession } from "next-auth/react";

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
  onNewConversation, // ✅ added
}: {
  userId: string | null;
  onSelectConversation: (conv: Conversation) => void;
  onNewConversation: (conversationId: number) => void; // ✅ added
}) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const { data: session } = useSession();

  // Fetch history
  useEffect(() => {
    async function fetchHistory() {
      if (!userId) return;
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
    fetchHistory();
  }, [userId]);

  // Start a new conversation
  const handleNewChat = async () => {
    if (!userId) return;
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/chat/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          message: " ", // 👈 send empty/placeholder message
        }),
      });
      const data = await res.json();

      // ✅ refresh conversations
      setConversations((prev) => [
        { conversation_id: data.conversation_id, title: "New Chat", messages: [] },
        ...prev,
      ]);

      // ✅ notify parent
      onNewConversation(data.conversation_id);
    } catch (err) {
      console.error("Error creating new chat:", err);
    }
  };

  return (
    <aside className="w-64 bg-gray-900 text-white border-r border-gray-700 flex flex-col">
      {/* Header */}
      <div className="p-4 flex justify-between items-center border-b border-gray-700">
        <h2 className="text-lg font-bold">Conversations</h2>
        {session && (
          <button
            onClick={handleNewChat}
            className="bg-cyan-500 px-2 py-1 text-sm font-semibold text-black rounded hover:bg-cyan-600"
          >
            + New
          </button>
        )}
      </div>

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

      {/* User Section */}
      <div className="relative border-t border-gray-700">
        {!session ? (
          <button
            onClick={() => signIn("google")}
            className="w-full px-4 py-3 text-center bg-cyan-500 text-black font-semibold hover:bg-cyan-600"
          >
            Login
          </button>
        ) : (
          <>
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
          </>
        )}
      </div>
    </aside>
  );
}
