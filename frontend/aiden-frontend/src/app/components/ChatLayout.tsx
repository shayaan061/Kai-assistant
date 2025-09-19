"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import ChatBox from "./ChatBox";
import Sidebar from "./Sidebar";

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
  const userId: string | null = session?.user?.id || null; // ✅ now string

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
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <Sidebar
  userId={userId}
  onSelectConversation={(conv) => setActiveId(conv.conversation_id)}
  onNewConversation={handleNewConversation}  // ✅ new prop
/>


        {/* Main Chat */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {userId ? (
            <ChatBox
              conversation={selectedConversation}
              userId={userId} // ✅ now string
              onNewConversation={handleNewConversation}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">
              Please log in to start chatting
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
