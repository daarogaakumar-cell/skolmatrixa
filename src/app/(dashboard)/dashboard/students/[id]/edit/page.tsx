import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { getStudentDetail, getClassesForDropdown, getBatchesForDropdown } from "@/actions/students";
import { getTenantProfile } from "@/actions/academic";
import { EditStudentClient } from "@/components/dashboard/edit-student-client";

export default async function EditStudentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  if (!["TENANT_ADMIN", "VICE_ADMIN"].includes(session.user.role)) {
    redirect("/dashboard");
  }

  const { id } = await params;

  const [result, tenant, classes, batches] = await Promise.all([
    getStudentDetail(id),
    getTenantProfile(),
    getClassesForDropdown(),
    getBatchesForDropdown(),
  ]);

  if (!result.success || !result.data) {
    notFound();
  }

  const student = result.data as any;

  return (
    <EditStudentClient
      student={{
        id: student.id,
        admissionNo: student.admissionNo,
        name: student.name,
        email: student.email,
        phone: student.phone,
        dateOfBirth: student.dateOfBirth?.toISOString?.() || student.dateOfBirth || null,
        gender: student.gender,
        address: student.address,
        photoUrl: student.photoUrl,
        classId: student.classId,
        batchId: student.batchId,
        rollNo: student.rollNo,
        guardianName: student.guardianName,
        guardianPhone: student.guardianPhone,
        guardianEmail: student.guardianEmail,
        guardianRelation: student.guardianRelation,
      }}
      tenantType={tenant?.type || "SCHOOL"}
      classes={(classes as any[]).map((c: any) => ({ id: c.id, name: c.name, section: c.section }))}
      batches={(batches as any[]).map((b: any) => ({ id: b.id, name: b.name }))}
    />
  );
}
