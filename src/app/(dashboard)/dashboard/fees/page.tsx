import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { FeeDashboardClient } from "@/components/dashboard/fee-dashboard-client";

export default async function FeesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  if (![
    "TENANT_ADMIN", "VICE_ADMIN", "ACCOUNTANT"
  ].includes(session.user.role)) {
    redirect("/dashboard");
  }

  return <FeeDashboardClient userRole={session.user.role} />;
}
