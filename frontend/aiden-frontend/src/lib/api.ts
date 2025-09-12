import axios from "axios";

const BASE = process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8000";

export async function sendChatMessage(message: string): Promise<string> {
  const res = await axios.post(`${BASE}/api/chat/`, { message }, { timeout: 20000 });
  // backend returns { reply: "..." } for chat
  if (res.data?.reply) return res.data.reply;
  // handle other shapes gracefully
  return JSON.stringify(res.data);
}

export async function parseRequest(message: string): Promise<any> {
  const res = await axios.post(`${BASE}/api/parse-request/`, { message }, { timeout: 20000 });
  // backend returns { parsed: {...} }
  return res.data?.parsed ?? res.data;
}
