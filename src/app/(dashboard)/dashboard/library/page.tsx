import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { LibraryDashboardClient } from "@/components/dashboard/library-dashboard-client";
import { SchoolLibraryDashboardClient } from "@/components/dashboard/school-library-dashboard-client";
import { getTenantProfile } from "@/actions/academic";

export default async function LibraryPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  if (!["TENANT_ADMIN", "VICE_ADMIN", "LIBRARIAN"].includes(session.user.role)) {
    redirect("/dashboard");
  }

  // Standalone LIBRARY tenant → full library dashboard
  if (session.user.tenantType === "LIBRARY") {
    return <LibraryDashboardClient />;
  }

  // Schools/Coaching → simple school library dashboard
  const tenant = await getTenantProfile();
  return (
    <SchoolLibraryDashboardClient
      tenantName={tenant?.name || ""}
      userName={session.user.name || "User"}
    />
  );
}
