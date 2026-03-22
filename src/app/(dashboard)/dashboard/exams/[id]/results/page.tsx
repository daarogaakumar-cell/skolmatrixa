import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ExamResultsClient } from "@/components/dashboard/exam-results-client";

export default async function ExamResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.tenantId) redirect("/login");

  const { id } = await params;

  const tenant = await prisma.tenant.findUnique({
    where: { id: session.user.tenantId },
    select: { type: true },
  });

  return (
    <ExamResultsClient
      examId={id}
      userRole={session.user.role}
      tenantType={tenant?.type || "SCHOOL"}
    />
  );
}
