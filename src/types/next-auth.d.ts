import { DefaultSession, DefaultUser } from "next-auth";
import { DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface User extends DefaultUser {
    role?: string;
    tenantId?: string | null;
    tenantSlug?: string | null;
    tenantType?: string | null;
  }

  interface Session extends DefaultSession {
    user: {
      id: string;
      role: string;
      tenantId: string | null;
      tenantSlug: string | null;
      tenantType: string | null;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id?: string;
    role?: string;
    tenantId?: string | null;
    tenantSlug?: string | null;
    tenantType?: string | null;
  }
}
