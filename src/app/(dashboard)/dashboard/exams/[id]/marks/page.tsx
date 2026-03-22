import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { MarksEntryClient } from "@/components/dashboard/marks-entry-client";

export default async function MarksEntryPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.tenantId) redirect("/login");

  if (!["TENANT_ADMIN", "VICE_ADMIN", "TEACHER"].includes(session.user.role)) {
    redirect("/dashboard/exams");
  }

  const { id } = await params;

  const tenant = await prisma.tenant.findUnique({
    where: { id: session.user.tenantId },
    select: { type: true },
  });

  return (
    <MarksEntryClient
      examId={id}
      userRole={session.user.role}
      tenantType={tenant?.type || "SCHOOL"}
    />
  );
}
