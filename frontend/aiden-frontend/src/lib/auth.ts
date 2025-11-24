import GoogleProvider from "next-auth/providers/google";
import { type NextAuthOptions } from "next-auth";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",               // force consent screen so Google shows all scopes
          access_type: "offline",          // needed to get refresh & access token
          response_type: "code",
          scope: [
            "openid",
            "email",
            "profile",
            "https://www.googleapis.com/auth/contacts.readonly",
          ].join(" "),
        },
      },
    }),
  ],

  session: {
    strategy: "jwt",
  },

  callbacks: {
    // 🔐 Store Google access token + profile data inside the JWT
    async jwt({ token, account, profile }) {
      // When user logs in for the first time
      if (account) {
        token.accessToken = account.access_token; // Google access token
        token.refreshToken = account.refresh_token; // optional
      }

      if (profile) {
        token.id = profile.sub;
        token.googleId = profile.sub;
        token.email = profile.email;
        token.name = profile.name;
        token.picture = (profile as any).picture;
      }

      return token;
    },

    // Expose token to client session
    async session({ session, token }) {
      session.user = {
        id: token.id as string,
        googleId: token.googleId as string,
        email: token.email as string,
        name: token.name as string,
        image: token.picture as string,
        accessToken: token.accessToken as string,
      };

      return session;
    },
  },

  pages: {
    signIn: "/auth/signin",
  },
};
