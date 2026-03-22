import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { LibrarySeatManagementClient } from "@/components/dashboard/library-seats-client";

export default async function LibrarySeatsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  if (!['TENANT_ADMIN', 'VICE_ADMIN', 'LIBRARIAN'].includes(session.user.role)) {
    redirect("/dashboard");
  }

  // Seats page is only for standalone LIBRARY tenants
  if (session.user.tenantType !== "LIBRARY") {
    redirect("/dashboard/library");
  }

  return <LibrarySeatManagementClient />;
}
