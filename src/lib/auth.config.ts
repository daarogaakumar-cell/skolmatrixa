import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

export const authConfig: NextAuthConfig = {
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        tenantId: { label: "Tenant ID", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = credentials.email as string;
        const password = credentials.password as string;
        const tenantId = (credentials.tenantId as string) || null;

        const user = await prisma.user.findFirst({
          where: {
            email,
            isActive: true,
            ...(tenantId ? { tenantId } : {}),
          },
          include: {
            tenant: { select: { id: true, slug: true, name: true, type: true, status: true } },
          },
        });

        if (!user) return null;

        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
        if (!isPasswordValid) return null;

        if (user.tenant && user.tenant.status !== "ACTIVE" && user.role !== "SUPER_ADMIN") {
          return null;
        }

        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          tenantId: user.tenantId,
          tenantSlug: user.tenant?.slug ?? null,
          tenantType: user.tenant?.type ?? null,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
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
    async authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      const { pathname } = request.nextUrl;

      const publicPaths = ["/", "/login", "/register", "/api/auth"];
      const isPublic = publicPaths.some((path) => pathname.startsWith(path));

      if (!isLoggedIn && !isPublic) {
        return false;
      }

      return true;
    },
  },
};
