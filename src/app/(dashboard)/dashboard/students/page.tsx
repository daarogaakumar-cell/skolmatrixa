import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getStudentList, getClassesForDropdown, getBatchesForDropdown } from "@/actions/students";
import { getTenantProfile } from "@/actions/academic";
import { StudentListClient } from "@/components/dashboard/student-list-client";

export default async function StudentsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const [studentResult, classes, batches, tenant] = await Promise.all([
    getStudentList(),
    getClassesForDropdown(),
    getBatchesForDropdown(),
    getTenantProfile(),
  ]);

  const canManage = ["TENANT_ADMIN", "VICE_ADMIN"].includes(session.user.role);

  return (
    <StudentListClient
      initialStudents={((studentResult as any).data || []).map((s: any) => ({
        ...s,
        dateOfBirth: s.dateOfBirth?.toISOString?.() || s.dateOfBirth || null,
      }))}
      initialPagination={(studentResult as any).pagination || { page: 1, pageSize: 25, total: 0, totalPages: 0 }}
      tenantType={tenant?.type || "SCHOOL"}
      classes={(classes as any[]).map((c: any) => ({ id: c.id, name: c.name, section: c.section }))}
      batches={(batches as any[]).map((b: any) => ({ id: b.id, name: b.name }))}
      canManage={canManage}
    />
  );
}
