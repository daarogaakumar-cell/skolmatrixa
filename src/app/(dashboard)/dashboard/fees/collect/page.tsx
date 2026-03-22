import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { FeeCollectClient } from "@/components/dashboard/fee-collect-client";

export default async function FeeCollectPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  if (
    !["TENANT_ADMIN", "VICE_ADMIN", "ACCOUNTANT"].includes(session.user.role)
  ) {
    redirect("/dashboard");
  }

  return <FeeCollectClient />;
}
