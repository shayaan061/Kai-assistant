import { getToken } from "next-auth/jwt";

export async function POST(req: Request) {
  const token = await getToken({ req: req as any });
  if (!token?.accessToken)
    return new Response("Unauthorized", { status: 401 });

  const { eventId } = await req.json();

  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
    { method: "DELETE", headers: { Authorization: `Bearer ${token.accessToken}` } }
  );

  return new Response(JSON.stringify({ success: true }));
}
