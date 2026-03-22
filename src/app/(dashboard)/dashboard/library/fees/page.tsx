import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { LibraryFeesClient } from "@/components/dashboard/library-fees-client";

export default async function LibraryFeesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  if (!['TENANT_ADMIN', 'VICE_ADMIN', 'LIBRARIAN'].includes(session.user.role)) {
    redirect("/dashboard");
  }

  // Library fees page is only for standalone LIBRARY tenants
  if (session.user.tenantType !== "LIBRARY") {
    redirect("/dashboard/library");
  }

  return <LibraryFeesClient />;
}
