import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      googleId?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      accessToken?: string; // store Google access token
    };
  }

  interface User {
    id: string;
    googleId?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    googleId?: string;
    email?: string;
    name?: string;
    picture?: string;
    accessToken?: string; // stored in JWT for later use
  }
}
