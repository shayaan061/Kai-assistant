export default function Message({ role, text }: { role: "user" | "assistant"; text: string }) {
  return (
    <div className={`flex ${role === "user" ? "justify-end" : "justify-start"}`}>
      <div
        className={`rounded-2xl px-4 py-2 max-w-[75%] whitespace-pre-wrap ${
          role === "user"
            ? "bg-gradient-to-r from-blue-600 to-cyan-500 text-white"
            : "bg-gray-800 border border-gray-700 text-gray-200"
        }`}
      >
        {text}
      </div>
    </div>
  );
}
