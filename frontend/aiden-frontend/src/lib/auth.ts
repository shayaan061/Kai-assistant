// frontend/lib/auth.ts
import GoogleProvider from "next-auth/providers/google";
import { type NextAuthOptions } from "next-auth";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,    // ✅ from .env.local
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],

  session: {
    strategy: "jwt", // store sessions in JWT (stateless, works well with Django)
  },

  callbacks: {
    async jwt({ token, account, profile }) {
      // 🔹 First login → enrich token with Google profile
      if (account && profile) {
        token.id = (profile as any).sub; // 👈 safely assign Google ID
        token.email = profile.email;
        token.name = profile.name;
        token.picture = (profile as any).picture; // 👈 profile.picture not in TS types
      }
      return token;
    },

    async session({ session, token }) {
      // 🔹 Expose token.id to the frontend session
      if (token) {
        session.user = {
          ...session.user,
          id: (token as any).id, // 👈 comes from above
          email: token.email as string,
          name: token.name as string,
          image: (token as any).picture as string,
        };
      }
      return session;
    },
  },

  pages: {
    signIn: "/auth/signin", // custom sign-in page
  },
};