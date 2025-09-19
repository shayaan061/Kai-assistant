import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async session({ session }) {
      // Sync with Django backend
      const res = await fetch("http://127.0.0.1:8000/api/sync-user/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: session.user?.email }),
      });

      const data = await res.json();
      (session as any).userId = data.user_id;
      return session;
    },
  },
});

export { handler as GET, handler as POST };
