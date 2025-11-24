import { getToken } from "next-auth/jwt";

export async function GET(req: Request) {
  const token = await getToken({ req: req as any });

  if (!token?.accessToken)
    return new Response(JSON.stringify({ error: "Not authenticated" }), { status: 401 });

  const res = await fetch(
    "https://www.googleapis.com/calendar/v3/calendars/primary/events",
    {
      headers: { Authorization: `Bearer ${token.accessToken}` },
    }
  );

  const data = await res.json();
  return Response.json(data);
}
