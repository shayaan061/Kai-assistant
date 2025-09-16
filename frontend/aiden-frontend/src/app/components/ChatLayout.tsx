"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import ChatBox from "./ChatBox";
import AuthButton from "./AuthButton";

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

export default function ChatLayout() {
  const { data: session } = useSession();
  const userId = (session as any)?.userId || null;

  const [convos, setConvos] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);

  // Fetch history from backend
  const fetchHistory = async () => {
    if (!userId) return; // wait until login
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/history/${userId}/`);
      const data = await res.json();
      setConvos(data);
      if (data.length > 0 && !activeId) {
        setActiveId(data[0].conversation_id);
      }
    } catch (err) {
      console.error("Error fetching history:", err);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [userId]);

  const selectedConversation =
    convos.find((c) => c.conversation_id === activeId) || null;

  const handleNewConversation = async (conversationId: number) => {
    await fetchHistory();
    setActiveId(conversationId);
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-gray-900 via-black to-gray-800 text-white overflow-hidden">
      {/* Top bar */}
      <header className="p-4 flex justify-end border-b border-gray-700 bg-black">
        <AuthButton />
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-72 border-r border-gray-700 p-4 hidden md:flex flex-col gap-4">
          <button
            onClick={() => setActiveId(null)}
            className="bg-cyan-500/90 hover:bg-cyan-600 text-black font-semibold py-2 rounded"
          >
            + New chat
          </button>

          <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar pr-1">
            {convos.length === 0 && (
              <div className="text-gray-400">No conversations yet — start a new chat</div>
            )}
            {convos.map((c) => (
              <div
                key={c.conversation_id}
                onClick={() => setActiveId(c.conversation_id)}
                className={`p-2 rounded cursor-pointer ${
                  c.conversation_id === activeId ? "bg-gray-700" : "hover:bg-gray-800"
                }`}
              >
                {c.title}
              </div>
            ))}
          </div>
        </aside>

        {/* Main Chat */}
        <main className="flex-1 flex flex-col overflow-hidden">
          <ChatBox
            conversation={selectedConversation}
            userId={userId}
            onNewConversation={handleNewConversation}
          />
        </main>
      </div>
    </div>
  );
}
