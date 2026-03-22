import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SuperAdminSidebar } from "@/components/layout/super-admin-sidebar";
import { SuperAdminHeader } from "@/components/layout/super-admin-header";

export default async function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const role = session.user.role;
  if (role !== "SUPER_ADMIN") {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen">
      <SuperAdminSidebar />
      <div className="flex flex-1 flex-col md:ml-64">
        <SuperAdminHeader userName={session.user.name || "Admin"} />
        <main className="flex-1 bg-gray-50/50 p-6">{children}</main>
      </div>
    </div>
  );
}
