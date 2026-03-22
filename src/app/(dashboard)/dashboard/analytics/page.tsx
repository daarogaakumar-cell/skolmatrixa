import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AnalyticsDashboardClient } from "@/components/dashboard/analytics-dashboard-client";

export default async function AnalyticsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  if (!["TENANT_ADMIN", "VICE_ADMIN"].includes(session.user.role)) {
    redirect("/dashboard");
  }

  return (
    <AnalyticsDashboardClient
      tenantType={session.user.tenantType || "SCHOOL"}
    />
  );
}
