import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { getStudentDetail } from "@/actions/students";
import { getTenantProfile } from "@/actions/academic";
import { StudentDetailClient } from "@/components/dashboard/student-detail-client";

export default async function StudentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id } = await params;

  const [result, tenant] = await Promise.all([
    getStudentDetail(id),
    getTenantProfile(),
  ]);

  if (!result.success || !result.data) {
    notFound();
  }

  const student = result.data as any;
  const canManage = ["TENANT_ADMIN", "VICE_ADMIN"].includes(session.user.role);

  return (
    <StudentDetailClient
      student={{
        ...student,
        dateOfBirth: student.dateOfBirth?.toISOString?.() || student.dateOfBirth || null,
        admissionDate: student.admissionDate?.toISOString?.() || student.admissionDate || null,
        createdAt: student.createdAt?.toISOString?.() || student.createdAt,
        user: student.user
          ? {
              ...student.user,
              lastLoginAt: student.user.lastLoginAt?.toISOString?.() || student.user.lastLoginAt || null,
            }
          : null,
      }}
      tenantType={tenant?.type || "SCHOOL"}
      canManage={canManage}
    />
  );
}
