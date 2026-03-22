import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { BulkEmailClient } from "@/components/dashboard/bulk-email-client";

export default async function BulkEmailPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  if (!["TENANT_ADMIN", "VICE_ADMIN"].includes(session.user.role)) {
    redirect("/dashboard");
  }

  return <BulkEmailClient />;
}
