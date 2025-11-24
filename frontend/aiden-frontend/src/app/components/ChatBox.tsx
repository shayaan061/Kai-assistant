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

  // Format assistant reply
  function sendAIResponse(text: string) {
    setMessages((prev) => [...prev, { role: "assistant", content: text }]);
  }

  // Detect "Call <number> and ask ..." pattern
  function detectCallWithMessage(text: string) {
    const callRegex = /call\s+(\d{7,15})(.*)/i;
    const match = text.match(callRegex);

    if (!match) return null;

    return {
      phone: match[1],
      message: match[2]?.trim() || null,
    };
  }

  // Normal call: "call 9136182311"
  function detectSimpleCall(text: string) {
    const callRegex = /call\s+(\d{7,15})/i;
    const match = text.match(callRegex);
    return match ? match[1] : null;
  }

  // Detect calendar scheduling
  function extractCalendarIntent(text: string) {
    if (!text.toLowerCase().includes("schedule")) return null;

    const parsed = chrono.parse(text);
    if (!parsed.length) return null;

    const start = parsed[0].start?.date();
    const end = new Date(start.getTime() + 60 * 60 * 1000);

    return { summary: text, start, end };
  }

  // MAIN HANDLER
  const sendMessage = async () => {
    if (!message.trim() || !userId) return;

    const userMessage = message.trim();
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setMessage("");
    setLoading(true);

    // ----------------------------------------
    // 🔥 Case 1: Call with message
    // "Call 9136182311 and ask him to join meeting"
    // ----------------------------------------
    const callIntent = detectCallWithMessage(userMessage);
    if (callIntent) {
      const { phone, message: askMessage } = callIntent;

      await fetch("http://127.0.0.1:8000/api/start-call/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone,
          name: askMessage ? askMessage : phone,
        }),
      });

      sendAIResponse(`📞 Calling ${phone} and saying: "${askMessage}"`);
      setLoading(false);
      return;
    }

    // ----------------------------------------
    // 🔥 Case 2: Simple Call → "call 9136182311"
    // ----------------------------------------
    const simpleCall = detectSimpleCall(userMessage);
    if (simpleCall) {
      await fetch("http://127.0.0.1:8000/api/start-call/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: simpleCall,
          name: simpleCall,
        }),
      });

      sendAIResponse(`📞 Calling ${simpleCall}...`);
      setLoading(false);
      return;
    }

    // ----------------------------------------
    // 🔥 Case 3: Schedule event
    // ----------------------------------------
    const calendarIntent = extractCalendarIntent(userMessage);
    if (calendarIntent) {
      const res = await fetch("/api/calendar/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          summary: calendarIntent.summary,
          start: calendarIntent.start.toISOString(),
          end: calendarIntent.end.toISOString(),
        }),
      });

      const data = await res.json();
      sendAIResponse(`📅 Event created: ${data.summary}`);
      setLoading(false);
      return;
    }

    // ----------------------------------------
    // 🔥 Case 4: Normal ChatGPT message
    // ----------------------------------------
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

      sendAIResponse(data.reply);
    } catch {
      sendAIResponse("⚠️ Backend error");
    }

    setLoading(false);
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