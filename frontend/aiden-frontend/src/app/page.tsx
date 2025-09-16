"use client";

import { useState } from "react";
import ChatBox from "./components/ChatBox";
import Sidebar from "./components/Sidebar";

export default function Home() {
  const [selectedConversation, setSelectedConversation] = useState<any>(null);

  return (
    <main className="flex h-screen bg-black text-white">
      {/* Sidebar */}
      <Sidebar userId={1} onSelectConversation={setSelectedConversation} />

      {/* Chat Window */}
      <div className="flex-1">
        <ChatBox conversation={selectedConversation} userId={1} />
      </div>
    </main>
  );
}
