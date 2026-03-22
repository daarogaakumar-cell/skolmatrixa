import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { LibraryBookIssuesClient } from "@/components/dashboard/library-book-issues-client";
import { SchoolLibraryIssuesClient } from "@/components/dashboard/school-library-issues-client";

export default async function LibraryBookIssuesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  if (!["TENANT_ADMIN", "VICE_ADMIN", "LIBRARIAN"].includes(session.user.role)) {
    redirect("/dashboard");
  }

  // Standalone LIBRARY tenant → member-based issue system
  if (session.user.tenantType === "LIBRARY") {
    return <LibraryBookIssuesClient />;
  }

  // Schools/Coaching → student-based issue system
  return <SchoolLibraryIssuesClient />;
}
