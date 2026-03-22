import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { LibraryMemberDetailClient } from "@/components/dashboard/library-member-detail-client";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function LibraryMemberDetailPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  if (!["TENANT_ADMIN", "VICE_ADMIN", "LIBRARIAN"].includes(session.user.role)) {
    redirect("/dashboard");
  }

  // Member detail is only for standalone LIBRARY tenants
  if (session.user.tenantType !== "LIBRARY") {
    redirect("/dashboard/library");
  }

  const { id } = await params;

  return <LibraryMemberDetailClient memberId={id} />;
}
