import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AddStaffClient } from "@/components/dashboard/add-staff-client";

export default async function NewStaffPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  if (!["TENANT_ADMIN", "VICE_ADMIN"].includes(session.user.role)) {
    redirect("/dashboard");
  }

  return <AddStaffClient />;
}
