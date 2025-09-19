"use client";

import { useEffect, useState, useRef } from "react";
import Message from "./Message";

interface MessageType {
  role: "user" | "assistant";
  content: string;
}

interface ChatBoxProps {
  conversation: any;
  userId: string;
  onNewConversation?: (conversationId: number) => void;
}

export default function ChatBox({ conversation, userId, onNewConversation }: ChatBoxProps) {
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<number | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (conversation) {
      setMessages(conversation.messages);
      setCurrentConversationId(conversation.conversation_id);
    } else {
      setMessages([]);
      setCurrentConversationId(null);
    }
  }, [conversation]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async () => {
    if (!message.trim() || !userId) return;

    const newUserMessage: MessageType = { role: "user", content: message };
    setMessages((prev) => [...prev, newUserMessage]);
    setMessage("");
    setLoading(true);

    try {
      const res = await fetch("http://127.0.0.1:8000/api/chat/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          conversation_id: currentConversationId,
          message,
        }),
      });

      const data = await res.json();

      if (!currentConversationId && data.conversation_id) {
        setCurrentConversationId(data.conversation_id);
        if (onNewConversation) onNewConversation(data.conversation_id);
      }

      const aiReply: MessageType = { role: "assistant", content: data.reply || "⚠️ Error" };
      setMessages((prev) => [...prev, aiReply]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "⚠️ Backend error" }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col p-4 overflow-hidden">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-2 mb-4 pr-2 custom-scrollbar">
        {messages.map((m, i) => (
          <Message key={i} role={m.role} text={m.content} />
        ))}
        {loading && <Message role="assistant" text="Kai is thinking..." />}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          className="flex-1 p-2 rounded bg-gray-800 border border-gray-600 focus:outline-none"
          placeholder="Type your message..."
        />
        <button
          onClick={sendMessage}
          disabled={loading}
          className="bg-cyan-500 hover:bg-cyan-600 text-black px-4 py-2 rounded"
        >
          Send
        </button>
      </div>
    </div>
  );
}
