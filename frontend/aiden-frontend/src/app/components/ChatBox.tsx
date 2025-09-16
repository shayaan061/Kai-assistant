"use client";

import { useEffect, useState, useRef } from "react";
import Message from "./Message";

interface MessageType {
  role: "user" | "assistant";
  content: string;
}

interface ChatBoxProps {
  conversation: any;
  userId: number;
  onNewConversation?: (conversationId: number) => void;
}

export default function ChatBox({ conversation, userId, onNewConversation }: ChatBoxProps) {
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<number | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Load conversation messages
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
    if (!message.trim()) return;

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

      // ✅ If new conversation created, update ID
      if (!currentConversationId && data.conversation_id) {
        setCurrentConversationId(data.conversation_id);
        if (onNewConversation) onNewConversation(data.conversation_id);
      }

      const aiReply: MessageType = {
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

  // ✅ Start a new chat (clear state + reset conversationId)
  const startNewChat = () => {
    setMessages([]);
    setCurrentConversationId(null);
    if (onNewConversation) onNewConversation(-1); // signal parent if needed
  };

  return (
    <div className="flex-1 flex flex-col p-4 overflow-hidden mt-5">
      {/* Top bar inside ChatBox */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Chat</h2>
        <button
          onClick={startNewChat}
          className="bg-cyan-500/90 hover:bg-cyan-600 text-black font-semibold px-3 py-1 rounded"
        >
          + New Chat
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-2 mb-4 pr-2 custom-scrollbar">
        {messages.map((m, i) => (
          <Message key={i} role={m.role} text={m.content} />
        ))}

        {loading && <Message role="assistant" text="Kai is thinking..." />}
        <div ref={bottomRef} />
      </div>

      {/* Input Bar */}
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
          className="bg-cyan-500 hover:bg-cyan-600 text-black font-semibold px-4 py-2 rounded"
        >
          Send
        </button>
      </div>
    </div>
  );
}
