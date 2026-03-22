import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { TenantSidebar } from "@/components/layout/tenant-sidebar";
import { TenantHeader } from "@/components/layout/tenant-header";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const role = session.user.role;

  if (role === "SUPER_ADMIN") {
    redirect("/super-admin");
  }

  const tenantId = session.user.tenantId;
  if (!tenantId) {
    redirect("/login");
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { name: true, type: true, logoUrl: true, status: true, setupCompleted: true },
  });

  if (!tenant || tenant.status !== "ACTIVE") {
    redirect("/login");
  }

  // If setup not completed, show minimal layout (setup page handles its own redirect)
  if (!tenant.setupCompleted) {
    return (
      <div className="min-h-screen bg-muted/30">
        <main>{children}</main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <TenantSidebar
        tenantType={tenant.type}
        tenantName={tenant.name}
        tenantLogo={tenant.logoUrl}
        userRole={role}
      />
      <div className="md:pl-64 transition-all duration-300">
        <TenantHeader
          userName={session.user.name || "User"}
          userRole={role}
          tenantName={tenant.name}
          tenantType={tenant.type}
        />
        <main className="p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
