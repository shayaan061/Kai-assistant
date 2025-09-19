"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import ChatBox from "./components/ChatBox";
import Sidebar from "./components/Sidebar";

export default function Home() {
  const { data: session } = useSession();
  const userId: string | null = session?.user?.id || null; // ✅ use string

  const [selectedConversation, setSelectedConversation] = useState<any>(null);

  return (
    <main className="flex h-screen bg-black text-white">
      {/* Sidebar */}
      <Sidebar
        userId={userId}
        onSelectConversation={setSelectedConversation}
      />

      {/* Chat Window */}
      <div className="flex-1 flex flex-col align-bottom">
        {userId ? (
          <ChatBox conversation={selectedConversation} userId={userId} />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            Please log in to start chatting
          </div>
        )}
      </div>
    </main>
  );
}