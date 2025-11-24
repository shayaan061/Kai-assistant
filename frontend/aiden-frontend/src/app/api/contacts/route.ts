import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function GET(req: NextRequest) {
  const token = await getToken({ req });

  if (!token) {
    return new Response("Unauthorized", { status: 401 });
  }

  const accessToken = token.accessToken as string;

  const res = await fetch(
    "https://people.googleapis.com/v1/people/me/connections?personFields=names,phoneNumbers",
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  const data = await res.json();
  return Response.json(data);
}
