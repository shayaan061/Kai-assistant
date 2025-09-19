import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;  // ✅ now session.user.id exists
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }

  interface User {
    id: string;
  }
}