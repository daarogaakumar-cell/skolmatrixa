/**
 * Edge-safe NextAuth config for use in middleware.
 * MUST NOT import Prisma or any Node.js-specific modules.
 * JWT and session callbacks only read from the token — no DB calls.
 */
import type { NextAuthConfig } from "next-auth";

export const authConfigEdge: NextAuthConfig = {
  providers: [],
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60,
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.tenantId = user.tenantId;
        token.tenantSlug = user.tenantSlug;
        token.tenantType = user.tenantType;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.tenantId = (token.tenantId as string) ?? null;
        session.user.tenantSlug = (token.tenantSlug as string) ?? null;
        session.user.tenantType = (token.tenantType as string) ?? null;
      }
      return session;
    },
    async authorized({ auth: session }) {
      // Minimal check — detailed routing is done in middleware function
      return true;
    },
  },
};
