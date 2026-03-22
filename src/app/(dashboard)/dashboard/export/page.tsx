import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ExportClient } from "@/components/dashboard/export-client";

export default async function ExportPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const allowedRoles = ["TENANT_ADMIN", "VICE_ADMIN", "ACCOUNTANT"];
  if (!allowedRoles.includes(session.user.role)) {
    redirect("/dashboard");
  }

  return <ExportClient />;
}
