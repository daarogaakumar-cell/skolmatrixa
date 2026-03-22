import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ExamCreateClient } from "@/components/dashboard/exam-create-client";

export default async function NewExamPage() {
  const session = await auth();
  if (!session?.user?.tenantId) redirect("/login");

  if (!["TENANT_ADMIN", "VICE_ADMIN", "TEACHER"].includes(session.user.role)) {
    redirect("/dashboard/exams");
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: session.user.tenantId },
    select: { type: true },
  });

  return <ExamCreateClient tenantType={tenant?.type || "SCHOOL"} />;
}
