"use client";

import { useState } from "react";
import ChatBox from "./components/ChatBox";
import Sidebar from "./components/Sidebar";
import AuthButton from "./components/AuthButton"; 


export default function Home() {
  const [selectedConversation, setSelectedConversation] = useState<any>(null);

  return (
    <main className="relative min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 text-white">
      {/* 🔹 Top bar with Login/Logout */}
      <header className="absolute top-4 right-4">
        <AuthButton />
      </header>
    <main className="flex h-screen bg-black text-white">
      {/* Sidebar */}
      <Sidebar userId={1} onSelectConversation={setSelectedConversation} />

      {/* Chat Window */}
      <div className="flex-1 flex flex-col align-bottom">
        <ChatBox conversation={selectedConversation} userId={1} />
      </div>
    </main>
    </main>
  );
}
