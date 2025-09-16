"use client";

import { useEffect, useState } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ChatBoxProps {
  conversation: any; // selected conversation
  userId: number;
  onNewConversation?: (conversationId: number) => void;
}

export default function ChatBox({ conversation, userId, onNewConversation }: ChatBoxProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // preload messages when switching convos
  useEffect(() => {
    if (conversation) {
      setMessages(conversation.messages);
    } else {
      setMessages([]);
    }
  }, [conversation]);

  const sendMessage = async () => {
    if (!message.trim()) return;

    const newUserMessage: Message = { role: "user", content: message };
    setMessages((prev) => [...prev, newUserMessage]);
    setMessage("");
    setLoading(true);

    try {
      const res = await fetch("http://127.0.0.1:8000/api/chat/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          conversation_id: conversation?.conversation_id || null,
          message,
        }),
      });

      const data = await res.json();

      if (!conversation && data.conversation_id && onNewConversation) {
        onNewConversation(data.conversation_id);
      }

      const aiReply: Message = {
        role: "assistant",
        content: data.reply || "⚠️ Error: no reply",
      };

      setMessages((prev) => [...prev, aiReply]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "⚠️ Error connecting to backend" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col p-4">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-2 mb-4">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`p-2 rounded max-w-lg ${
              m.role === "user"
                ? "bg-cyan-500/20 self-end text-right"
                : "bg-gray-700/50 self-start"
            }`}
          >
            {m.content}
          </div>
        ))}

        {/* 🔹 Show loader when AI is thinking */}
        {loading && (
          <div className="italic text-gray-400 self-start">Kai is thinking...</div>
        )}
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          className="flex-1 p-2 rounded bg-gray-800 border border-gray-600 focus:outline-none"
          placeholder="Type your message..."
          disabled={loading}
        />
        <button
          onClick={sendMessage}
          disabled={loading}
          className="bg-cyan-500 hover:bg-cyan-600 text-black font-semibold px-4 py-2 rounded"
        >
          {loading ? "..." : "Send"}
        </button>
      </div>
    </div>
  );
}
