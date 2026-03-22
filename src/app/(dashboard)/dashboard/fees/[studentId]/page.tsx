import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { FeeStudentDetailClient } from "@/components/dashboard/fee-student-detail-client";

interface Props {
  params: Promise<{ studentId: string }>;
}

export default async function StudentFeeDetailPage({ params }: Props) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  if (
    !["TENANT_ADMIN", "VICE_ADMIN", "ACCOUNTANT"].includes(session.user.role)
  ) {
    redirect("/dashboard");
  }

  const { studentId } = await params;

  const student = await prisma.student.findFirst({
    where: {
      id: studentId,
      tenantId: session.user.tenantId!,
    },
    select: {
      id: true,
      name: true,
      admissionNo: true,
      guardianName: true,
      guardianPhone: true,
      class: { select: { name: true } },
      batch: { select: { name: true } },
    },
  });

  if (!student) notFound();

  return (
    <FeeStudentDetailClient
      studentId={student.id}
      studentBasic={{
        name: student.name,
        admissionNo: student.admissionNo,
        className: student.class?.name || null,
        batchName: student.batch?.name || null,
        guardianName: student.guardianName || null,
      }}
    />
  );
}
