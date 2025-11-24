import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function POST(req: NextRequest) {
  const token = await getToken({ req });

  if (!token?.accessToken) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await req.json();
  const { summary, start, end } = body;

  const res = await fetch(
    "https://www.googleapis.com/calendar/v3/calendars/primary/events",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        summary,
        start: { dateTime: start, timeZone: "Asia/Kolkata" },
        end: { dateTime: end, timeZone: "Asia/Kolkata" },
      }),
    }
  );

  const data = await res.json();
  return NextResponse.json(data);
}