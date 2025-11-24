import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
          scope:
            "openid email profile https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/contacts.readonly",
        },
      },
    }),
  ],

  session: {
    strategy: "jwt",
  },

  callbacks: {
    // ⭐ Step 1: Save Google token + profile into JWT
    async jwt({ token, account, profile }) {
      if (account) {
        token.accessToken = account.access_token; // ⭐ needed for contacts + calendar
        token.googleId = profile?.sub;
        token.email = profile?.email;
        token.name = profile?.name;
        token.picture = (profile as any)?.picture;
      }
      return token;
    },

    // ⭐ Step 2: Attach everything to session.user
    async session({ session, token }) {
      session.user = {
        id: token.googleId as string,
        googleId: token.googleId as string,
        email: token.email as string,
        name: token.name as string,
        image: token.picture as string,
        accessToken: token.accessToken as string, // ⭐ required for Google Calendar API
      };

      // ⭐ Step 3: Sync user with Django backend
      const res = await fetch("http://127.0.0.1:8000/api/sync-user/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: session.user.email }),
      });

      const data = await res.json();
      session.user.id = data.user_id; // Use Django user ID for backend ops

      return session;
    },
  },

  pages: {
    signIn: "/auth/signin",
  },
});

export { handler as GET, handler as POST };