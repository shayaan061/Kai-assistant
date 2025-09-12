"use client";

import { useEffect, useRef, useState } from "react";
import Message from "./Message";
import { sendChatMessage, parseRequest } from "@/lib/api";
import useSpeech from "../../../src/hooks/useSpeech";

type ChatMessage = { role: "user" | "assistant"; content: string };

export default function ChatBox({ sessionId }: { sessionId: string | null }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [useParseEndpoint, setUseParseEndpoint] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // voice hook: provides start/stop recording (web speech) + play text
  const { listening, startListening, stopListening, speak } = useSpeech({
    onResult: (transcript: string) => setText(transcript),
  });

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 99999, behavior: "smooth" });
  }, [messages, loading]);

  const pushMessage = (m: ChatMessage) => setMessages((s) => [...s, m]);

  const handleSend = async () => {
    if (!text.trim()) return;
    const userMsg = text.trim();
    pushMessage({ role: "user", content: userMsg });
    setText("");
    setLoading(true);

    try {
      if (useParseEndpoint) {
        // structured parse endpoint
        const parsed = await parseRequest(userMsg);
        pushMessage({ role: "assistant", content: JSON.stringify(parsed, null, 2) });
        await speak(`Parsed result: ${JSON.stringify(parsed)}`);
      } else {
        // conversational endpoint
        const reply = await sendChatMessage(userMsg);
        pushMessage({ role: "assistant", content: reply });
        await speak(reply);
      }
    } catch (e: any) {
      pushMessage({ role: "assistant", content: `Error: ${e.message || e}` });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <div className="text-xl font-semibold">Aiden</div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-gray-300">
            <input
              type="checkbox"
              checked={useParseEndpoint}
              onChange={() => setUseParseEndpoint((v) => !v)}
            />
            Use parse endpoint
          </label>
        </div>
      </div>

      {/* messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((m, i) => (
          <Message key={i} role={m.role} text={m.content} />
        ))}

        {loading && (
          <div className="text-gray-400 italic">Aiden is thinking…</div>
        )}
      </div>

      {/* input bar */}
      <div className="p-4 border-t border-gray-700 bg-gradient-to-t from-black/50 to-transparent flex items-center gap-3">
        <button
          onClick={() => (listening ? stopListening() : startListening())}
          className={`p-3 rounded-full ${listening ? "bg-red-600" : "bg-gray-800"} `}
          aria-label="voice"
        >
          {/* simple mic icon */}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v5a3 3 0 0 0 3 3z" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M19 11v1a7 7 0 01-14 0v-1" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M12 19v3" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Message Aiden..."
          className="flex-1 bg-gray-900 border border-gray-700 px-4 py-3 rounded-lg outline-none focus:ring-2 focus:ring-cyan-400"
        />

        <button
          onClick={handleSend}
          disabled={loading}
          className="px-5 py-3 bg-cyan-500 text-black rounded-lg font-semibold hover:brightness-110"
        >
          Send
        </button>
      </div>
    </div>
  );
}
