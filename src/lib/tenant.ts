import { headers } from "next/headers";
import { prisma } from "./prisma";

export async function getTenantFromSlug(slug: string) {
  const tenant = await prisma.tenant.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      type: true,
      status: true,
      logoUrl: true,
      settings: true,
      setupCompleted: true,
    },
  });
  return tenant;
}

export async function getCurrentTenantSlug(): Promise<string | null> {
  const headersList = await headers();
  const host = headersList.get("host") || "";

  // Extract subdomain: slug.example.com -> slug
  const parts = host.split(".");
  if (parts.length >= 3) {
    return parts[0];
  }

  // For localhost, check x-tenant-slug header (dev convenience)
  const tenantSlug = headersList.get("x-tenant-slug");
  return tenantSlug;
}

export async function getCurrentTenant() {
  const slug = await getCurrentTenantSlug();
  if (!slug) return null;
  return getTenantFromSlug(slug);
}

export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .substring(0, 50);
}

export async function isSlugAvailable(slug: string): Promise<boolean> {
  const existing = await prisma.tenant.findUnique({ where: { slug } });
  return !existing;
}
