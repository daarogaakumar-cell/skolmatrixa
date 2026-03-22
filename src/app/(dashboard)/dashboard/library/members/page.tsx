import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { LibraryMembersClient } from "@/components/dashboard/library-members-client";

export default async function LibraryMembersPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  if (!['TENANT_ADMIN', 'VICE_ADMIN', 'LIBRARIAN'].includes(session.user.role)) {
    redirect("/dashboard");
  }

  // Members page is only for standalone LIBRARY tenants
  if (session.user.tenantType !== "LIBRARY") {
    redirect("/dashboard/library");
  }

  return <LibraryMembersClient />;
}
