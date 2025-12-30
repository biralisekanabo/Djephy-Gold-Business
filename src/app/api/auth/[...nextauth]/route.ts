import NextAuth from "next-auth";
import type { Session } from "next-auth";
import type { JWT } from "next-auth/jwt";
import GoogleProvider from "next-auth/providers/google";
import GithubProvider from "next-auth/providers/github";

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
    GithubProvider({
      clientId: process.env.GITHUB_ID ?? "",
      clientSecret: process.env.GITHUB_SECRET ?? "",
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({
      token,
      account,
    }: {
      token: JWT & { accessToken?: string };
      account?: Record<string, unknown> | null;
    }) {
      if (
        account &&
        typeof account === "object" &&
        "access_token" in account &&
        typeof (account as Record<string, unknown>)["access_token"] === "string"
      ) {
        token.accessToken = (account as Record<string, string>)["access_token"];
      }

      return token;
    },
    async session({
      session,
      token,
    }: {
      session: Session;
      token: JWT & { accessToken?: string };
    }) {
      return { ...session, accessToken: token.accessToken };
    },
  },
});

export { handler as GET, handler as POST };
