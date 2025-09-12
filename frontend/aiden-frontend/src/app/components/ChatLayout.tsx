import ChatBox from "./ChatBox";
import { useState } from "react";

export default function ChatLayout() {
  const [convos, setConvos] = useState<Array<{ id: string; title: string }>>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  const startNew = () => {
    const id = Date.now().toString();
    const title = `New chat ${convos.length + 1}`;
    setConvos([{ id, title }, ...convos]);
    setActiveId(id);
  };

  return (
    <div className="h-screen flex bg-gradient-to-br from-gray-900 via-black to-gray-800 text-white">
      {/* Sidebar */}
      <aside className="w-72 border-r border-gray-700 p-4 hidden md:flex flex-col gap-4">
        <button
          onClick={startNew}
          className="bg-cyan-500/90 hover:bg-cyan-600 text-black font-semibold py-2 rounded"
        >
          + New chat
        </button>

        <div className="flex-1 overflow-y-auto space-y-2">
          {convos.length === 0 && (
            <div className="text-gray-400">No conversations yet — start a new chat</div>
          )}
          {convos.map((c) => (
            <div
              key={c.id}
              onClick={() => setActiveId(c.id)}
              className={`p-2 rounded cursor-pointer ${
                c.id === activeId ? "bg-gray-700" : "hover:bg-gray-800"
              }`}
            >
              {c.title}
            </div>
          ))}
        </div>

        <div className="text-sm text-gray-400">
          Aiden — AI assistant. Built with Django + Gemini.
        </div>
      </aside>

      {/* Main Chat area */}
      <main className="flex-1 flex flex-col">
        <ChatBox sessionId={activeId} />
      </main>
    </div>
  );
}
