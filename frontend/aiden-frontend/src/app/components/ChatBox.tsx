"use client";

import { useEffect, useState, useRef } from "react";
import Message from "./Message";
import * as chrono from "chrono-node";

interface MessageType {
  role: "user" | "assistant";
  content: string;
}

interface Conversation {
  conversation_id: number;
  messages: MessageType[];
  title: string;
}

interface ChatBoxProps {
  conversation: Conversation | null;
  userId: string;
  onNewConversation?: (conversationId: number) => void;
}

export default function ChatBox({
  conversation,
  userId,
  onNewConversation,
}: ChatBoxProps) {
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentConversationId, setCurrentConversationId] =
    useState<number | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);

  // Load selected conversation
  useEffect(() => {
    if (conversation) {
      setMessages(conversation.messages);
      setCurrentConversationId(conversation.conversation_id);
    } else {
      setMessages([]);
      setCurrentConversationId(null);
    }
  }, [conversation]);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // 🔥 Search Google Contacts
  async function searchContact(name: string) {
    try {
      const res = await fetch("/api/contacts");
      const data = await res.json();

      for (const person of data.connections || []) {
        const personName = person.names?.[0]?.displayName || "";
        const phone = person.phoneNumbers?.[0]?.value || "";

        if (personName.toLowerCase().includes(name.toLowerCase())) {
          return { name: personName, phone };
        }
      }

      return null;
    } catch (err) {
      console.error("Contact search failed:", err);
      return null;
    }
  }

  // Helper: Add AI message
  function sendAIResponse(text: string) {
    setMessages((prev) => [...prev, { role: "assistant", content: text }]);
  }

  // 🔥 Check if user is scheduling an event
  function extractCalendarIntent(text: string) {
    if (!text.toLowerCase().includes("schedule")) return null;

    const parsed = chrono.parse(text);
    if (!parsed.length) return null;

    const start = parsed[0].start?.date();
    const end = new Date(start.getTime() + 60 * 60 * 1000); // default 1-hour event

    return {
      summary: text,
      start,
      end,
    };
  }

  // MAIN handler
  const sendMessage = async () => {
    if (!message.trim() || !userId) return;

    const userMessage = message.trim();
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setMessage("");
    setLoading(true);

    // 🔥 Calendar scheduling
    const calendarIntent = extractCalendarIntent(userMessage);
    if (calendarIntent) {
      const { summary, start, end } = calendarIntent;

      const res = await fetch("/api/calendar/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          summary,
          start: start.toISOString(),
          end: end.toISOString(),
        }),
      });

      const data = await res.json();

      setLoading(false);
      return sendAIResponse(`📅 Event created: ${data.summary || "Scheduled!"}`);
    }

    // 🔥 Calling flow
    if (userMessage.toLowerCase().startsWith("call ")) {
      const name = userMessage.replace("call ", "").trim();
      const contact = await searchContact(name);

      if (!contact) {
        setLoading(false);
        return sendAIResponse("I couldn't find that contact.");
      }

      await fetch("http://127.0.0.1:8000/api/start-call/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(contact),
      });

      setLoading(false);
      return sendAIResponse(`📞 Calling ${contact.name} at ${contact.phone}...`);
    }

    // 🔥 Normal chat
    try {
      const res = await fetch("http://127.0.0.1:8000/api/chat/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          conversation_id: currentConversationId,
          message: userMessage,
        }),
      });

      const data = await res.json();

      if (!currentConversationId && data.conversation_id) {
        setCurrentConversationId(data.conversation_id);
        onNewConversation?.(data.conversation_id);
      }

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.reply },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "⚠️ Backend error" },
      ]);
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
