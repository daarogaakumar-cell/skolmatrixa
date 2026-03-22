import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { LibraryIdCardClient } from "@/components/dashboard/library-id-card-client";

export default async function LibraryIdCardsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  if (!['TENANT_ADMIN', 'VICE_ADMIN', 'LIBRARIAN'].includes(session.user.role)) {
    redirect("/dashboard");
  }

  // ID cards page is only for standalone LIBRARY tenants
  if (session.user.tenantType !== "LIBRARY") {
    redirect("/dashboard/library");
  }

  return <LibraryIdCardClient />;
}
