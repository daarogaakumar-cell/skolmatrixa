import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ExamListClient } from "@/components/dashboard/exam-list-client";
import { MyExamsClient } from "@/components/dashboard/my-exams-client";

export default async function ExamsPage() {
  const session = await auth();
  if (!session?.user?.tenantId) redirect("/login");

  const tenant = await prisma.tenant.findUnique({
    where: { id: session.user.tenantId },
    select: { type: true },
  });

  // Students and parents see their exams view
  if (["STUDENT", "PARENT"].includes(session.user.role)) {
    return <MyExamsClient userRole={session.user.role} />;
  }

  return (
    <ExamListClient
      tenantType={tenant?.type || "SCHOOL"}
      userRole={session.user.role}
    />
  );
}
